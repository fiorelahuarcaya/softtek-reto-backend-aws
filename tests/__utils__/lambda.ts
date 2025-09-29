import type { APIGatewayProxyEventV2, Context } from "aws-lambda";

export const mockContext = (overrides: Partial<Context> = {}): Context => ({
  callbackWaitsForEmptyEventLoop: false,
  functionName: "test-function",
  functionVersion: "1",
  invokedFunctionArn:
    "arn:aws:lambda:us-east-1:000000000000:function:test-function",
  memoryLimitInMB: "128",
  awsRequestId: "unit-req-1",
  logGroupName: "/aws/lambda/test-function",
  logStreamName: "2024/01/01/test-stream",
  getRemainingTimeInMillis: () => 30000,
  done: () => undefined,
  fail: () => undefined,
  succeed: () => undefined,
  ...overrides,
});

export const httpEventV2 = (
  overrides: Partial<APIGatewayProxyEventV2> = {}
): APIGatewayProxyEventV2 => ({
  version: "2.0",
  routeKey: "$default",
  rawPath: "/",
  rawQueryString: "",
  headers: {},
  requestContext: {
    accountId: "000000000000",
    apiId: "api-id",
    domainName: "example.com",
    domainPrefix: "example",
    http: {
      method: "GET",
      path: "/",
      sourceIp: "127.0.0.1",
      userAgent: "jest",
      protocol: "HTTP/1.1",
    },
    requestId: "req-1",
    routeKey: "$default",
    stage: "dev",
    time: new Date().toISOString(),
    timeEpoch: Date.now(),
  },
  isBase64Encoded: false,
  ...overrides,
});
