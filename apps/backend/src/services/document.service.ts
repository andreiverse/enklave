import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { documents } from "../db/schema";
import { eq } from "drizzle-orm";

export class DocumentService {
    constructor(
        private readonly db: NodePgDatabase
    ) {

    }

    async findDocumentsByOwner(ownerId: string): Promise<(typeof documents.$inferSelect)[]> {
        let results = await
            this.db.select().from(documents).where(eq(documents.ownerId, ownerId));

        return results;
    }

    async createDocument(document: typeof documents.$inferInsert) {
        let insert = await
            this.db.insert(documents).values(document);

        if (insert.rowCount == 0) {
            throw new Error("couldn't insert document: " + JSON.stringify(document));
        }

        return insert.rows[0];
    }
}