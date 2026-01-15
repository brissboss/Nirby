/**
 * Common-related OpenAPI schemas
 * These schemas define the structure of common API responses
 */

export const commonSchemas = {
  SingleMessageResponse: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
    required: ["message"],
    example: {
      message: "This is a message",
    },
  },
  UploadResponse: {
    type: "object",
    properties: {
      url: { type: "string", format: "uri" },
    },
    required: ["url"],
    example: {
      url: "https://example.com/avatar.png",
    },
  },
  Image: {
    type: "string",
    format: "binary",
    description: "Binary image data (JPEG format)",
    example: "data:image/jpeg;base64,<base64-encoded-image>",
  },
  PaginationResponse: {
    type: "object",
    properties: {
      page: { type: "integer" },
      limit: { type: "integer" },
      total: { type: "integer" },
      totalPages: { type: "integer" },
    },
    required: ["page", "limit", "total", "totalPages"],
    example: {
      page: 1,
      limit: 10,
      total: 100,
      totalPages: 10,
    },
  },
  HealthCheckResponse: {
    type: "object",
    properties: {
      ok: { type: "boolean" },
      service: { type: "string" },
      time: { type: "string", format: "date-time" },
    },
    required: ["ok", "service", "time"],
    example: {
      ok: true,
      service: "api",
      time: "2021-01-01T00:00:00.000Z",
    },
  },
  HealthDatabaseResponse: {
    type: "object",
    properties: {
      ok: { type: "boolean" },
      db: { type: "string", format: "date-time" },
    },
    required: ["ok", "db"],
    example: {
      ok: true,
      db: "2021-01-01T00:00:00.000Z",
    },
  },
  Error: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      error: {
        type: "object",
        properties: {
          code: { type: "string" },
          message: { type: "string" },
          details: { type: "object", nullable: true },
        },
      },
    },
    example: {
      success: false,
      error: {
        code: "ERROR_CODE",
        message: "This is an error message",
      },
    },
  },
} as const;
