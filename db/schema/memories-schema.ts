import { index, pgTable, text, timestamp, uuid, vector } from "drizzle-orm/pg-core";

export const memoriesTable = pgTable("memories", {
    id: uuid("id").primaryKey().defaultRandom(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 256 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate( () => new Date())
}, (table) => ({
    embeddingIndex: index("embedding_index").using("hnsw", table.embedding.op("vector_ip_ops"))
}));
// Define types for insert and select operations
export type InsertMemories = typeof memoriesTable.$inferInsert;
export type SelectMemories = typeof memoriesTable.$inferSelect;