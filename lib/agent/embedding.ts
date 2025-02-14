// import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
// for the embedding length of 256 we need to use openai, cohere api does not provide 256 length embeddings
// for more info: https://docs.cohere.com/v2/reference/embed
// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY
// });

export async function generateEmbedding(texts: string[]) {
    return texts.map(() => Array(256).fill(0).map(() => Math.random()));
    // try {
    //     const response = await openai.embeddings.create({
    //         model: "text-embedding-3-small",
    //         dimensions: 256,
    //         input: texts
    //         });
    //         return response.data.map((item) => item.embedding);
    // } catch (error) {
    //     console.error("Error generating embeddings:", error);
    //     throw error;
    // }
}