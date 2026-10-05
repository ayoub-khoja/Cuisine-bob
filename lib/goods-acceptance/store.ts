import { MongoClient, ObjectId, type Collection } from "mongodb";
import {
  buildAcceptances,
  type AcceptanceLine,
  type GoodsAcceptanceSheet,
} from "@/lib/goods-acceptance/sheet";
import type { RequestLine } from "@/lib/material-request/sheet";

export type GoodsAcceptanceDoc = {
  _id: ObjectId;
  requestId: string;
  serial: string;
  dateKey: string;
  supplierId: string;
  supplierName: string;
  lines: AcceptanceLine[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string | null;
};

const globalForMongo = globalThis as unknown as {
  dailyMongo?: MongoClient;
  goodsAcceptanceIndexReady?: boolean;
};

function databaseName(url: string): string {
  const match = url.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/);
  return decodeURIComponent(match?.[1] || "stockly");
}

export async function goodsAcceptanceCollection(): Promise<Collection<GoodsAcceptanceDoc>> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  if (!globalForMongo.dailyMongo) {
    globalForMongo.dailyMongo = new MongoClient(url);
  }
  await globalForMongo.dailyMongo.connect();
  const collection = globalForMongo.dailyMongo
    .db(databaseName(url))
    .collection<GoodsAcceptanceDoc>("GoodsAcceptance");
  if (!globalForMongo.goodsAcceptanceIndexReady) {
    await collection.createIndex({ requestId: 1, supplierId: 1 }, { unique: true });
    await collection.createIndex({ dateKey: -1, createdAt: -1 });
    globalForMongo.goodsAcceptanceIndexReady = true;
  }
  return collection;
}

export function toObjectId(id: string): ObjectId | null {
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

export function docToSheet(doc: GoodsAcceptanceDoc): GoodsAcceptanceSheet {
  return {
    id: doc._id.toHexString(),
    requestId: doc.requestId,
    serial: doc.serial,
    dateKey: doc.dateKey,
    supplierId: doc.supplierId,
    supplierName: doc.supplierName,
    lines: doc.lines,
  };
}

/** Replace the acceptance sheets that belong to one material request. */
export async function syncGoodsAcceptances(input: {
  requestId: string;
  serial: string;
  dateKey: string;
  lines: RequestLine[];
  userId: string;
}): Promise<void> {
  const collection = await goodsAcceptanceCollection();
  const drafts = buildAcceptances(input);
  const supplierIds = drafts.map((draft) => draft.supplierId);
  await collection.deleteMany({
    requestId: input.requestId,
    ...(supplierIds.length > 0 ? { supplierId: { $nin: supplierIds } } : {}),
  });
  if (drafts.length === 0) return;
  const now = new Date();
  await collection.bulkWrite(
    drafts.map((draft) => ({
      updateOne: {
        filter: { requestId: draft.requestId, supplierId: draft.supplierId },
        update: {
          $set: {
            serial: draft.serial,
            dateKey: draft.dateKey,
            supplierName: draft.supplierName,
            lines: draft.lines,
            updatedAt: now,
            updatedBy: input.userId,
          },
          $setOnInsert: {
            createdAt: now,
            createdBy: input.userId,
          },
        },
        upsert: true,
      },
    })),
  );
}

export async function deleteGoodsAcceptances(requestId: string): Promise<void> {
  const collection = await goodsAcceptanceCollection();
  await collection.deleteMany({ requestId });
}
