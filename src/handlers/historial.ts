import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "../core/db";

export const handler = async (event: any) => {
  const qs = event.queryStringParameters || {};
  const limit = Math.min(Number(qs.limit ?? 10), 100);
  const cursor = qs.cursor;

  const params: any = {
    TableName: Tables.history,
    KeyConditionExpression: "pk = :pk",
    ExpressionAttributeValues: { ":pk": "fusionados" },
    ScanIndexForward: false, // recientes primero
    Limit: limit,
  };
  if (cursor) params.ExclusiveStartKey = { pk: "fusionados", sk: cursor };

  try {
    const res = await ddb.send(new QueryCommand(params));
    const nextCursor = res.LastEvaluatedKey?.sk ?? null;
    return {
      statusCode: 200,
      body: JSON.stringify({ items: res.Items ?? [], nextCursor }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to read history",
        error: err?.message,
      }),
    };
  }
};

export default handler;
