import { z } from "zod";
import { randomUUID } from "node:crypto";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "../core/db";
import { createLogger } from "../core/logger";

const BodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  notes: z.string().max(2000).optional(),
});

export const handler = async (event: any, context: any) => {
  const log = createLogger({
    component: "fusionados",
    reqId: context?.awsRequestId,
    gwReqId: event?.requestContext?.requestId,
    path: event?.rawPath,
    stage: event?.requestContext?.stage,
  });

  const reqId = context.awsRequestId;
  log.info("REQUEST_RECEIVED", { qs: event.queryStringParameters });

  try {
    const bodyRaw =
      typeof event.body === "string"
        ? event.body
        : JSON.stringify(event.body || "{}");
    const parsed = BodySchema.safeParse(JSON.parse(bodyRaw || "{}"));
    if (!parsed.success) {
      log.warn("STORE_INVALID_BODY", { reqId, issues: parsed.error.format() });
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid body",
          issues: parsed.error.format(),
        }),
      };
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    await ddb.send(
      new PutCommand({
        TableName: Tables.storage,
        Item: { pk: `item#${id}`, id, ...parsed.data, createdAt: now },
      })
    );
    log.info("STORE_SUCCESS", { reqId, id });

    return {
      statusCode: 201,
      body: JSON.stringify({ id, ...parsed.data, createdAt: now }),
    };
  } catch (err: any) {
    log.error("STORE_FAILED", { reqId, error: err?.message });
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to store item",
        error: err?.message,
      }),
    };
  }
};

export default handler;
