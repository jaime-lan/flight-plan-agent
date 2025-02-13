import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { memoriesTable } from "./schema/memories-schema";

config({ path: ".env.local" });

const databaseURL = process.env.DATABASE_URL;

if (!databaseURL) {
    throw new Error("Database URL is not set");
}

const dbSchema = {
    memories: memoriesTable
};

function createClient(url: string) {
    const client = postgres(url, { prepare: false });
    return drizzle(client, { schema: dbSchema });
}

export const db = createClient(databaseURL);