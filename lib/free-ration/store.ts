import { MongoClient, ObjectId, type Collection } from "mongodb";
import type { PermitInput, PermitLine } from "@/lib/free-ration/sheet";

export type FreeRationDoc = {
  _id: ObjectId;
  serial: string;
  dateKey: string;
  time: string;
  lines: PermitLine[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string | null;
};

const globalForMongo = globalThis as unknown as {
  dailyMongo?: MongoClient;
  freeRationIndexReady?: boolean;
};

function databaseName(url: string): string {
  const match = url.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/);
  return decodeURIComponent(match?.[1] || "stockly");
}

export async function freeRationCollection(): Promise<Collection<FreeRationDoc>> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  if (!globalForMongo.dailyMongo) {
    globalForMongo.dailyMongo = new MongoClient(url);
  }
  await globalForMongo.dailyMongo.connect();
  const collection = globalForMongo.dailyMongo
    .db(databaseName(url))
    .collection<FreeRationDoc>("FreeRationPermit");
  if (!globalForMongo.freeRationIndexReady) {
    await collection.createIndex({ dateKey: -1, createdAt: -1 });
    globalForMongo.freeRationIndexReady = true;
  }
  return collection;
}

export function toObjectId(id: string): ObjectId | null {
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}
