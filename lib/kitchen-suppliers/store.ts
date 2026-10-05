import { MongoClient, ObjectId, type Collection, type Filter } from "mongodb";
import type { SupplierProduct } from "@/lib/kitchen-suppliers/supplier";

export type KitchenSupplierDoc = {
  _id: ObjectId;
  companyName: string;
  taxId: string;
  products: SupplierProduct[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string | null;
};

const globalForMongo = globalThis as unknown as {
  dailyMongo?: MongoClient;
  kitchenSupplierIndexReady?: boolean;
  kitchenSupplierProductIndexReady?: boolean;
};

function databaseName(url: string): string {
  const match = url.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/);
  return decodeURIComponent(match?.[1] || "stockly");
}

export async function kitchenSupplierCollection(): Promise<
  Collection<KitchenSupplierDoc>
> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  if (!globalForMongo.dailyMongo) {
    globalForMongo.dailyMongo = new MongoClient(url);
  }
  await globalForMongo.dailyMongo.connect();
  const collection = globalForMongo.dailyMongo
    .db(databaseName(url))
    .collection<KitchenSupplierDoc>("KitchenSupplier");
  if (!globalForMongo.kitchenSupplierIndexReady) {
    await collection.createIndex({ taxId: 1 }, { unique: true });
    await collection.createIndex({ createdAt: -1 });
    globalForMongo.kitchenSupplierIndexReady = true;
  }
  if (!globalForMongo.kitchenSupplierProductIndexReady) {
    await collection.createIndex(
      { "products.nameKey": 1 },
      { unique: true, sparse: true },
    );
    globalForMongo.kitchenSupplierProductIndexReady = true;
  }
  return collection;
}

export function toObjectId(id: string): ObjectId | null {
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function supplierSearchFilter(
  query: string,
): Filter<KitchenSupplierDoc> {
  const q = query.trim().slice(0, 80);
  if (!q) return {};
  const pattern = escapeRegex(q);
  return {
    $or: [
      { companyName: { $regex: pattern, $options: "i" } },
      { taxId: { $regex: pattern, $options: "i" } },
    ],
  };
}

export function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

export function duplicateKeyField(error: unknown): string | null {
  if (!isDuplicateKey(error)) return null;
  const pattern = (error as { keyPattern?: Record<string, number> }).keyPattern;
  const field = pattern ? Object.keys(pattern)[0] : undefined;
  return field ?? null;
}
