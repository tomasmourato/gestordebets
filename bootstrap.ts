import dotenv from "dotenv";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

console.log("DATABASE_URL =", process.env.DATABASE_URL);

await import("./server");