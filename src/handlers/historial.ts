import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "../core/db";
import { createLogger } from "../core/logger";
import { requireAuth } from "../middlewares/requireAuth";
import { withJson } from "../utils/http";
import type { HttpHandler } from "../utils/http";

export const handler: HttpHandler = withJson(async (event, context) => {
  const auth = await requireAuth(event);
  if (!auth.ok) {
    return { statusCode: auth.statusCode, body: auth.body };
  }

  const log = createLogger({
    component: "historial",
    reqId: context?.awsRequestId,
    path: event?.rawPath,
  });

  const qs = event.queryStringParameters || {};
  const limit = Math.min(Number(qs.limit ?? 10), 100);
  const cursor = qs.cursor;
  log.info("REQUEST_RECEIVED", { limit, cursor });

  const params: QueryCommandInput = {
    TableName: Tables.history,
    KeyConditionExpression: "pk = :pk",
    ExpressionAttributeValues: { ":pk": "fusionados" },
    ScanIndexForward: false,
    Limit: limit,
  };

  const queryInput: QueryCommandInput = cursor
    ? { ...params, ExclusiveStartKey: { pk: "fusionados", sk: cursor } }
    : params;

  try {
    const t0 = Date.now();
    const res = await ddb.send(new QueryCommand(queryInput));
    const ms = Date.now() - t0;
    const nextCursor = res.LastEvaluatedKey?.sk ?? null;
    log.info("QUERY_OK", { items: res.Items?.length ?? 0, nextCursor, ms });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: { items: res.Items ?? [], nextCursor },
    };
  } catch (err: any) {
    log.error("QUERY_FAILED", { error: err?.message });
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: {
        message: "Failed to read history",
        error: err?.message,
      },
    };
  }
});

export default handler;
