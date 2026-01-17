/**
 * Auth-related OpenAPI schemas
 * These schemas define the structure of authentication-related API responses
 */

export const authSchemas = {
  UserBasic: {
    type: "object",
    properties: {
      id: { type: "string" },
      email: { type: "string", format: "email" },
    },
    required: ["id", "email"],
    example: {
      id: "1234567890",
      email: "test@example.com",
    },
  },
  User: {
    type: "object",
    properties: {
      id: { type: "string" },
      email: { type: "string", format: "email" },
      name: { type: "string", nullable: true },
      avatarUrl: { type: "string", format: "uri", nullable: true },
      bio: { type: "string", nullable: true },
      emailVerified: { type: "boolean" },
    },
    required: ["id", "email", "emailVerified"],
    example: {
      id: "1234567890",
      email: "test@example.com",
      name: "John Doe",
      avatarUrl: "https://example.com/avatar.png",
      bio: "I am a test user",
      emailVerified: true,
    },
  },
  SignupResponse: {
    type: "object",
    properties: {
      user: { $ref: "#/components/schemas/UserBasic" },
    },
    required: ["user"],
    example: {
      user: {
        id: "1234567890",
        email: "test@example.com",
      },
    },
  },
  GetMeResponse: {
    type: "object",
    properties: {
      user: { $ref: "#/components/schemas/User" },
    },
    required: ["user"],
    example: {
      user: {
        id: "1234567890",
        email: "test@example.com",
        name: "John Doe",
        avatarUrl: "https://example.com/avatar.png",
        bio: "I am a test user",
        emailVerified: true,
      },
    },
  },
  VerifyEmailResponse: {
    type: "object",
    properties: {
      user: { $ref: "#/components/schemas/User" },
    },
    required: ["user"],
    example: {
      user: {
        id: "1234567890",
        email: "test@example.com",
        name: "John Doe",
        avatarUrl: "https://example.com/avatar.png",
        bio: "I am a test user",
        emailVerified: true,
      },
    },
  },
  LoginResponse: {
    type: "object",
    properties: {
      user: { $ref: "#/components/schemas/UserBasic" },
      accessToken: { type: "string" },
    },
    required: ["user", "accessToken"],
    example: {
      user: {
        id: "1234567890",
        email: "test@example.com",
      },
      accessToken: "1234567890",
    },
  },
  RefreshTokenResponse: {
    type: "object",
    properties: {
      accessToken: { type: "string" },
    },
    required: ["accessToken"],
    example: {
      accessToken: "1234567890",
    },
  },
} as const;
