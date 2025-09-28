import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { createLogger } from "./logger";

const log = createLogger({ component: "cache" });

const mem = new Map<string, { payload: any; expiresAt: number }>();
const isOffline =
  process.env.IS_OFFLINE === "true" || process.env.IS_OFFLINE === "1";
const TABLE = process.env.CACHE_TABLE;
const USE_DDB = !!TABLE && !isOffline;
const ddb = USE_DDB
  ? DynamoDBDocumentClient.from(new DynamoDBClient({}))
  : null;

export type CacheSource = "MEMORY" | "DDB" | "MISS";

export async function getCachedOrFetchMeta<T>(
  pk: string,
  fetcher: () => Promise<T>,
  ttlSec = 1800
): Promise<{ payload: T; source: CacheSource }> {
  const t0 = Date.now();
  const now = Math.floor(t0 / 1000);

  const m = mem.get(pk);
  if (m && m.expiresAt > now) {
    log.debug("CACHE_HIT_MEMORY", { pk, ms: Date.now() - t0 });
    return { payload: m.payload as T, source: "MEMORY" };
  }

  if (ddb && TABLE) {
    try {
      const g = await ddb.send(
        new GetCommand({ TableName: TABLE, Key: { pk } })
      );
      const it = g.Item as any;
      if (it?.expiresAt && it.expiresAt > now && it.payload) {
        mem.set(pk, { payload: it.payload, expiresAt: it.expiresAt });
        log.debug("CACHE_HIT_DDB", { pk, ms: Date.now() - t0 });
        return { payload: it.payload as T, source: "DDB" };
      }
      log.debug("CACHE_MISS_DDB", { pk, ms: Date.now() - t0 });
    } catch (err) {
      log.warn("CACHE_DDB_ERROR", { pk, error: (err as Error).message });
    }
  }

  const payload = await fetcher();
  const expiresAt = now + ttlSec;
  mem.set(pk, { payload, expiresAt });

  if (ddb && TABLE) {
    try {
      await ddb.send(
        new PutCommand({ TableName: TABLE, Item: { pk, payload, expiresAt } })
      );
      log.debug("CACHE_WRITE_DDB", { pk, ms: Date.now() - t0 });
    } catch (err) {
      log.warn("CACHE_WRITE_ERROR", { pk, error: (err as Error).message });
    }
  } else {
    log.debug("CACHE_WRITE_MEMORY_ONLY", { pk, ms: Date.now() - t0 });
  }

  return { payload, source: "MISS" };
}

export async function getCachedOrFetch<T>(
  pk: string,
  fetcher: () => Promise<T>,
  ttlSec = 1800
) {
  const { payload } = await getCachedOrFetchMeta<T>(pk, fetcher, ttlSec);
  return payload;
}
