import { defineRelations } from "drizzle-orm";
import { pgTable, uuid, unique, varchar, timestamp } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
	id: uuid().primaryKey().defaultRandom().notNull(),
	username: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email)
]);

export const documents = pgTable("documents", {
	id: uuid().primaryKey().defaultRandom().notNull(),
	createdAt: timestamp().defaultNow().notNull(),
	updatedAt: timestamp().defaultNow().notNull(),
	fileName: varchar({ length: 255 }).notNull(),
	ownerId: uuid("owner_id").notNull().references(() => users.id)
});

export const relations = defineRelations({ users, documents }, (r) => ({
	documents: {
		owner: r.one.users({
			from: r.documents.ownerId,
			to: r.users.id
		})
	},
	users: {
		documents: r.many.documents()
	}
}))