import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

// --- In-memory fallback ---
const mem = new Map<string, { payload: any; expiresAt: number }>();

// serverless-offline suele inyectar IS_OFFLINE=true
const isOffline =
  process.env.IS_OFFLINE === "true" || process.env.IS_OFFLINE === "1";
const TABLE = process.env.CACHE_TABLE;
const USE_DDB = !!TABLE && !isOffline; // <- NO uses DDB en offline

const ddb = USE_DDB
  ? DynamoDBDocumentClient.from(new DynamoDBClient({}))
  : null;

export async function getCachedOrFetch<T>(
  pk: string,
  fetcher: () => Promise<T>,
  ttlSec = 1800
): Promise<T> {
  const now = Math.floor(Date.now() / 1000);

  // 1) Mem cache
  const m = mem.get(pk);
  if (m && m.expiresAt > now) return m.payload as T;

  // 2) DDB (solo si no es offline)
  if (ddb && TABLE) {
    try {
      const g = await ddb.send(
        new GetCommand({ TableName: TABLE, Key: { pk } })
      );
      const it = g.Item as any;
      if (it?.expiresAt && it.expiresAt > now && it.payload) {
        mem.set(pk, { payload: it.payload, expiresAt: it.expiresAt }); // warm memory
        return it.payload as T;
      }
    } catch {
      // ignora errores de credenciales/red en local
    }
  }

  // 3) Fetch real + write-through
  const payload = await fetcher();
  const expiresAt = now + ttlSec;

  mem.set(pk, { payload, expiresAt });

  if (ddb && TABLE) {
    try {
      await ddb.send(
        new PutCommand({ TableName: TABLE, Item: { pk, payload, expiresAt } })
      );
    } catch {
      // ignora en local
    }
  }

  return payload;
}
