import { db } from "../../db/index";
import { memoriesTable } from "../../db/schema/memories-schema";
import { generateEmbedding } from "./embedding";
import {sql, asc, cosineDistance} from "drizzle-orm";

export async function saveMemory(memory: string): Promise<string>{
    const [embedding] = await generateEmbedding([memory]);
    await db.insert(memoriesTable).values({
        content: memory,
        embedding: embedding
    });
    // console.log("Memory saved successfully");
    return "Memory saved successfully";
}

const MEMORY_LIMIT = 5;

export async function getMemory(query: string){
    const embedding = await generateEmbedding([query]);
    const similarity = sql<number>`${cosineDistance(memoriesTable.embedding, embedding[0])}`;

    const memToReturn = await db.query.memories.findMany({
        where: (memories, { gt }) => gt(similarity, 0.7),
        orderBy: asc(similarity),
        limit: MEMORY_LIMIT
    });
    // console.log(memToReturn);
    return memToReturn;
}