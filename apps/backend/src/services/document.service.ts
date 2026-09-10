import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { documents } from "../db/schema";
import { randomUUIDv7 } from "bun";
import { S3Service } from "./s3.service";
import { eq } from "drizzle-orm/sql";

export class DocumentService {
    constructor(
        private readonly db: NodePgDatabase,
        private readonly s3: S3Service
    ) {

    }

    async findDocumentById(id: string): Promise<null | typeof documents.$inferSelect> {
        const results = await
            this.db.select().from(documents).where(eq(documents.id, id));

        return results.length > 0 ? results[0] : null;
    }

    async findDocumentsByOwner(ownerId: string): Promise<(typeof documents.$inferSelect)[]> {
        const results = await
            this.db.select().from(documents).where(eq(documents.ownerId, ownerId));

        return results;
    }

    buildS3KeyFromDocument(document: typeof documents.$inferInsert) {
        if (!document.id) throw new Error("can't construct document key with null id");
        if (!document.ownerId) throw new Error("can't construct document key with null owner id");

        return `documents/${document.ownerId}/${document.id}/original`;
    }

    async createDocument(doc: Pick<typeof documents.$inferInsert, 'fileName' | 'ownerId'>, buffer: ArrayBuffer) {
        const documentId = randomUUIDv7();

        const currentDate = new Date();

        const document: typeof documents.$inferInsert = {
            ...doc,
            id: documentId,
            createdAt: currentDate,
            updatedAt: currentDate
        }

        const s3Key = this.buildS3KeyFromDocument(document);

        await this.s3.writeFile(s3Key, buffer);

        try {
            const [insert] = await
                this.db.insert(documents).values(document).returning();

            if (!insert) {
                throw new Error("couldn't insert document: " + JSON.stringify(document));
            }

            return insert;
        } catch (e) {
            this.s3.deleteFile(s3Key).catch(e => {
                console.error("Error deleting file after catching error", e);
            }); 

            throw e;            
        }
    }
}