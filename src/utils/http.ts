export function jsonResponse(
  statusCode: number,
  data: any,
  headers?: Record<string, string>
) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(headers || {}),
    },
    body: typeof data === "string" ? data : JSON.stringify(data),
  };
}

export const withJson =
  <T extends (event: any, context: any) => Promise<any>>(fn: T) =>
  async (event: any, context: any) => {
    const res = await fn(event, context);
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
      ...(res.headers || {}),
    };
    const body =
      typeof res.body === "string" ? res.body : JSON.stringify(res.body ?? {});
    return { ...res, headers, body };
  };
