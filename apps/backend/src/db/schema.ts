import { defineRelations } from "drizzle-orm";
import { pgTable, uuid, unique, varchar, timestamp, AnyPgColumn } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: uuid().primaryKey().defaultRandom().notNull(),
	username: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email)
]);

export const folders = pgTable("folders", {
	id: uuid().primaryKey().defaultRandom().notNull(),
	createdAt: timestamp().defaultNow().notNull(),
	updatedAt: timestamp().defaultNow().notNull(),
	name: varchar({ length: 255 }).notNull(),
	parentFolderId: uuid("parent_folder_id").references((): AnyPgColumn => folders.id),
	ownerId: uuid("owner_id").notNull().references(() => users.id)
});

export const documents = pgTable("documents", {
	id: uuid().primaryKey().defaultRandom().notNull(),
	createdAt: timestamp().defaultNow().notNull(),
	updatedAt: timestamp().defaultNow().notNull(),
	fileName: varchar({ length: 255 }).notNull(),
	ownerId: uuid("owner_id").notNull().references(() => users.id),
	parentFolderId: uuid("parent_folder_id").references(() => folders.id)
});

export const relations = defineRelations({ users, documents, folders }, (r) => ({
	documents: {
		owner: r.one.users({
			from: r.documents.ownerId,
			to: r.users.id
		}),
		folder: r.one.folders({
			from: r.documents.parentFolderId,
			to: r.folders.id
		})
	},
	users: {
		documents: r.many.documents(),
		folders: r.many.folders()
	},
	folders: {
		owner: r.one.users({
			from: r.folders.ownerId,
			to: r.users.id
		}),
		documents: r.many.documents(),
		childFolders: r.many.folders(),
		parentFolder: r.one.folders({
			from: r.folders.parentFolderId,
			to: r.folders.id
		})
	}
}));