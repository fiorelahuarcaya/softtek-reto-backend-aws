import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from "aws-lambda";

export function jsonResponse(
  statusCode: number,
  data: unknown,
  headers?: Record<string, string>
): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(headers ?? {}),
    },
    body: typeof data === "string" ? data : JSON.stringify(data),
  };
}

type JsonishResult = {
  statusCode?: number;
  headers?: Record<string, string | number | boolean | undefined>;
  isBase64Encoded?: boolean;
  cookies?: string[];
  body?: unknown;
};

type JsonishHandler = (
  event: APIGatewayProxyEventV2,
  context: Context
) => Promise<JsonishResult>;

export type HttpHandler = (
  event: APIGatewayProxyEventV2,
  context: Context
) => Promise<APIGatewayProxyStructuredResultV2>;

export const withJson =
  (fn: JsonishHandler): HttpHandler =>
  async (event, context) => {
    const res = await fn(event, context);
    const mergedHeaders = {
      "Content-Type": "application/json; charset=utf-8",
      ...(res.headers ?? {}),
    };
    const headers = Object.fromEntries(
      Object.entries(mergedHeaders).filter(([, value]) => value !== undefined)
    ) as Record<string, string | number | boolean>;
    const body =
      typeof res.body === "string"
        ? res.body
        : res.body === undefined
          ? undefined
          : JSON.stringify(res.body);

    return {
      ...res,
      headers,
      body,
    };
  };
