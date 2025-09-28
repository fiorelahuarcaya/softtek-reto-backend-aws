import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "../core/db";

export type RateLimitCfg = {
  endpoint: string;
  limit: number;
  windowSec?: number;
  key?: string;
};

export async function enforceRateLimit(event: any, cfg: RateLimitCfg) {
  const windowSec = cfg.windowSec ?? 60;
  const nowSec = Math.floor(Date.now() / 1000);
  const windowStart = nowSec - (nowSec % windowSec);

  const ip = event?.requestContext?.http?.sourceIp || "unknown";
  const clientKey = cfg.key || ip;

  const pk = `ratelimit#${cfg.endpoint}#${clientKey}#${windowStart}`;
  const expiresAt = windowStart + windowSec + 5;

  try {
    await ddb.send(
      new UpdateCommand({
        TableName: Tables.cache,
        Key: { pk },
        UpdateExpression:
          "SET #c = if_not_exists(#c, :zero) + :incr, #exp = if_not_exists(#exp, :exp)",
        ConditionExpression: "attribute_not_exists(#c) OR #c < :limit",
        ExpressionAttributeNames: { "#c": "count", "#exp": "expiresAt" },
        ExpressionAttributeValues: {
          ":zero": 0,
          ":incr": 1,
          ":limit": cfg.limit,
          ":exp": expiresAt,
        },
      })
    );
    return { ok: true };
  } catch (err: any) {
    if (err?.name === "ConditionalCheckFailedException") {
      return {
        ok: false,
        statusCode: 429,
        body: { message: "Too many requests" },
      };
    }
    throw err;
  }
}
