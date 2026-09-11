import { and, eq } from "drizzle-orm/sql";
import { folders } from "../db/schema";
import { randomUUIDv7 } from "bun";
import { Database } from "../services";
import { AppException } from "../exception/AppException";

type FolderFilter = {
    ownerId?: string;
    parentFolderId?: string | null;
};

export class FolderService {
    constructor(
        private readonly db: Database
    ) { }

    async findFolders(filter: FolderFilter) {
        return await this.db.query.folders.findMany({
            where: {
                ownerId: filter.ownerId !== undefined
                    ? { eq: filter.ownerId }
                    : undefined,

                parentFolderId:
                    filter.parentFolderId === null
                        ? { isNull: true }
                        : filter.parentFolderId !== undefined
                            ? { eq: filter.parentFolderId }
                            : undefined,
            },
            with: {
                parentFolder: true,
            },
        });
    }

    async findFolderById(
        id: string,
        ownerId: string
    ): Promise<null | typeof folders.$inferSelect> {
        const [folder] = await this.db
            .select()
            .from(folders)
            .where(
                and(
                    eq(folders.id, id),
                    eq(folders.ownerId, ownerId)
                )
            );

        return folder ?? null;
    }

    async createFolder(
        name: string,
        ownerId: string,
        parentFolderId: string | null = null
    ) {
        if (parentFolderId) {
            const parent = await this.findFolderById(
                parentFolderId,
                ownerId
            );

            if (!parent) {
                throw new AppException(404, "Parent folder not found");
            }
        }

        const id = randomUUIDv7();
        const now = new Date();

        const [folder] = await this.db
            .insert(folders)
            .values({
                id,
                name,
                ownerId,
                parentFolderId,
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        if (!folder) {
            throw new AppException(500, "Couldn't create folder");
        }

        return folder;
    }

    async updateFolder(
        id: string,
        ownerId: string,
        updates: Partial<
            Pick<
                typeof folders.$inferInsert,
                "name" | "parentFolderId"
            >
        >
    ) {
        if (updates.parentFolderId !== undefined &&
            updates.parentFolderId !== null) {

            // Folder must belong to the same owner.
            const parent = await this.findFolderById(
                updates.parentFolderId,
                ownerId
            );

            if (!parent) {
                throw new AppException(404, "Parent folder not found");
            }

            // Don't allow a folder to be its own parent.
            if (updates.parentFolderId === id) {
                throw new AppException(400,
                    "A folder cannot be its own parent"
                );
            }
        }

        const [folder] = await this.db
            .update(folders)
            .set({
                ...updates,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(folders.id, id),
                    eq(folders.ownerId, ownerId)
                )
            )
            .returning();

        return folder ?? null;
    }

    async deleteFolder(
        id: string,
        ownerId: string
    ) {
        const folder = await this.findFolderById(id, ownerId);

        if (!folder) {
            return null;
        }

        // Don't delete non-empty folders.
        const children = await this.db
            .select({ id: folders.id })
            .from(folders)
            .where(
                and(
                    eq(folders.ownerId, ownerId),
                    eq(folders.parentFolderId, id)
                )
            )
            .limit(1);

        if (children.length > 0) {
            throw new AppException(409,
                "Cannot delete a folder containing child folders"
            );
        }

        const [deleted] = await this.db
            .delete(folders)
            .where(
                and(
                    eq(folders.id, id),
                    eq(folders.ownerId, ownerId)
                )
            )
            .returning();

        return deleted ?? null;
    }
}