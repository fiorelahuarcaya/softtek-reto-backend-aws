import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const isOffline =
  process.env.IS_OFFLINE === "true" || process.env.IS_OFFLINE === "1";

const baseConfig: any = {};
// if (isOffline && process.env.DDB_ENDPOINT) {
//   baseConfig.endpoint = process.env.DDB_ENDPOINT;
//   baseConfig.credentials = { accessKeyId: "local", secretAccessKey: "local" };
//   baseConfig.region = "us-east-1";
// }

export const ddb = DynamoDBDocumentClient.from(new DynamoDBClient(baseConfig));

export const Tables = {
  cache: process.env.CACHE_TABLE!,
  history: process.env.HISTORY_TABLE!,
  storage: process.env.STORAGE_TABLE!,
};
