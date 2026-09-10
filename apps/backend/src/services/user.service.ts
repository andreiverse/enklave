import { NodePgDatabase } from "drizzle-orm/node-postgres"
import { users } from "../db/schema"
import { eq } from "drizzle-orm/sql";

export class UserService {
    constructor(
        private readonly db: NodePgDatabase
    ) { }

    async findUserByEmail(email: string) {
        let user = await this.db.select().from(users).where(eq(users.email, email));

        return user.length > 0 ? user[0] : null;
    }

    async findUserById(id: string) {
        let user = await this.db.select().from(users).where(eq(users.id, id));

        return user.length > 0 ? user[0] : null;
    }
    
    async createUser(user: typeof users.$inferInsert) {
        return await this.db.insert(users).values(user);
    }

}