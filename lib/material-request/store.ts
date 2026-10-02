import { MongoClient, ObjectId, type Collection } from "mongodb";
import type { RequestLine } from "@/lib/material-request/sheet";

export type MaterialRequestDoc = {
  _id: ObjectId;
  serial: string;
  dateKey: string;
  lines: RequestLine[];
  signatory?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string | null;
};

const globalForMongo = globalThis as unknown as {
  dailyMongo?: MongoClient;
  materialRequestIndexReady?: boolean;
};

function databaseName(url: string): string {
  const match = url.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/);
  return decodeURIComponent(match?.[1] || "stockly");
}

export async function materialRequestCollection(): Promise<Collection<MaterialRequestDoc>> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  if (!globalForMongo.dailyMongo) {
    globalForMongo.dailyMongo = new MongoClient(url);
  }
  await globalForMongo.dailyMongo.connect();
  const collection = globalForMongo.dailyMongo
    .db(databaseName(url))
    .collection<MaterialRequestDoc>("MaterialRequest");
  if (!globalForMongo.materialRequestIndexReady) {
    await collection.createIndex({ dateKey: -1, createdAt: -1 });
    globalForMongo.materialRequestIndexReady = true;
  }
  return collection;
}

export function toObjectId(id: string): ObjectId | null {
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}
