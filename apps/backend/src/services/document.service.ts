import { documents } from "../db/schema";
import { randomUUIDv7 } from "bun";
import { S3Service } from "./s3.service";
import { and, eq } from "drizzle-orm/sql";
import { Database } from "../services";
import { AppException } from "../exception/AppException";

type DocumentFilter = {
    ownerId?: string;
    parentFolderId?: string | null;
}

export class DocumentService {
    constructor(
        private readonly db: Database,
        private readonly s3: S3Service
    ) { }

    async findDocumentById(
        id: string,
        ownerId: string
    ): Promise<null | typeof documents.$inferSelect> {
        const results = await this.db
            .select()
            .from(documents)
            .where(
                and(
                    eq(documents.id, id),
                    eq(documents.ownerId, ownerId)
                )
            );

        return results[0] ?? null;
    }

    async findDocuments(
        filter: DocumentFilter
    ): Promise<(typeof documents.$inferSelect)[]> {
        return await this.db.query.documents.findMany({
            where: {
                ownerId: filter.ownerId === undefined ? undefined : {
                    eq: filter.ownerId,
                },
                parentFolderId:
                    filter.parentFolderId === null
                        ? { isNull: true }
                        : filter.parentFolderId !== undefined
                            ? { eq: filter.parentFolderId }
                            : undefined,
            },
            with: {
                folder: true,
            },
        });
    }

    buildS3KeyFromDocument(document: typeof documents.$inferInsert) {
        if (!document.id)
            throw new AppException(400, "can't construct document key with null id");

        if (!document.ownerId)
            throw new AppException(400, "can't construct document key with null owner id");

        return `documents/${document.ownerId}/${document.id}/original`;
    }

    async createDocument(
        doc: Pick<
            typeof documents.$inferInsert,
            "fileName" | "ownerId" | "parentFolderId"
        >,
        buffer: ArrayBuffer
    ) {
        const documentId = randomUUIDv7();
        const currentDate = new Date();

        const document: typeof documents.$inferInsert = {
            ...doc,
            id: documentId,
            createdAt: currentDate,
            updatedAt: currentDate,
        };

        const s3Key = this.buildS3KeyFromDocument(document);

        await this.s3.writeFile(s3Key, buffer);

        try {
            const [insert] = await this.db
                .insert(documents)
                .values(document)
                .returning();

            if (!insert) {
                throw new AppException(500,
                    "couldn't insert document: " + JSON.stringify(document)
                );
            }

            return insert;
        } catch (e) {
            this.s3.deleteFile(s3Key).catch((e) => {
                console.error(
                    "Error deleting file after catching error",
                    e
                );
            });

            throw e;
        }
    }

    async updateDocument(
        id: string,
        ownerId: string,
        updates: Partial<
            Pick<
                typeof documents.$inferInsert,
                "fileName" | "parentFolderId"
            >
        >
    ) {
        const [document] = await this.db
            .update(documents)
            .set({
                ...updates,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(documents.id, id),
                    eq(documents.ownerId, ownerId)
                )
            )
            .returning();

        return document ?? null;
    }

    async deleteDocument(id: string, ownerId: string): Promise<true> {
        const document = await this.findDocumentById(id, ownerId);

        if (!document) {
            throw new AppException(404, "Document not found");
        }

        const [deleted] = await this.db
            .delete(documents)
            .where(
                and(
                    eq(documents.id, id),
                    eq(documents.ownerId, ownerId)
                )
            )
            .returning();

        if (!deleted) {
            throw new AppException(404, "Document not found");
        }

        const s3Key = this.buildS3KeyFromDocument(deleted);

        try {
            await this.s3.deleteFile(s3Key);
        } catch (e) {
            console.error(
                `Document ${id} was deleted from DB but S3 deletion failed`,
                e
            );
        }

        return true;
    }
}