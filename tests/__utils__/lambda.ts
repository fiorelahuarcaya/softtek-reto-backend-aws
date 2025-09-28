export const mockContext = (overrides: Partial<any> = {}) => ({
  awsRequestId: "unit-req-1",
  getRemainingTimeInMillis: () => 30000,
  ...overrides,
});

export const httpEventV2 = (overrides: Record<string, any> = {}) => ({
  version: "2.0",
  rawPath: "/",
  headers: {},
  requestContext: {
    stage: "dev",
    requestId: "req-1",
    http: {
      method: "GET",
      path: "/",
      sourceIp: "127.0.0.1",
      protocol: "HTTP/1.1",
      userAgent: "jest",
    },
  },
  ...overrides,
});
