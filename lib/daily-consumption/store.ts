import { MongoClient, ObjectId, type Collection } from "mongodb";
import type {
  ConsumptionLine,
  DailySheetInput,
  DayMenu,
  HeadcountRow,
} from "@/lib/daily-consumption/sheet";

export type DailyConsumptionDoc = {
  _id: ObjectId;
  dateKey: string;
  headcounts: HeadcountRow[];
  lines: ConsumptionLine[];
  menu: DayMenu;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string | null;
};

const globalForMongo = globalThis as unknown as {
  dailyMongo?: MongoClient;
  dailyIndexReady?: boolean;
};

function databaseName(url: string): string {
  const match = url.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/);
  return decodeURIComponent(match?.[1] || "stockly");
}

export async function dailyConsumptionCollection(): Promise<
  Collection<DailyConsumptionDoc>
> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  if (!globalForMongo.dailyMongo) {
    globalForMongo.dailyMongo = new MongoClient(url);
  }
  await globalForMongo.dailyMongo.connect();
  const collection = globalForMongo.dailyMongo
    .db(databaseName(url))
    .collection<DailyConsumptionDoc>("DailyConsumption");
  if (!globalForMongo.dailyIndexReady) {
    await collection.createIndex({ dateKey: 1 }, { unique: true });
    globalForMongo.dailyIndexReady = true;
  }
  return collection;
}

export function toObjectId(id: string): ObjectId | null {
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

export function docToSheet(doc: DailyConsumptionDoc) {
  return {
    id: doc._id.toHexString(),
    dateKey: doc.dateKey,
    headcounts: doc.headcounts,
    lines: doc.lines,
    menu: doc.menu ?? {},
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function sheetFields(sheet: DailySheetInput) {
  return {
    dateKey: sheet.dateKey,
    headcounts: sheet.headcounts,
    lines: sheet.lines,
    menu: sheet.menu,
  };
}
