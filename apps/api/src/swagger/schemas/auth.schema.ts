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
  ExportMeProfile: {
    type: "object",
    properties: {
      id: { type: "string" },
      email: { type: "string", format: "email" },
      name: { type: "string", nullable: true },
      avatarUrl: { type: "string", nullable: true },
      bio: { type: "string", nullable: true },
      emailVerified: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: ["id", "email", "emailVerified", "createdAt", "updatedAt"],
  },
  ExportMePoi: {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      description: { type: "string", nullable: true },
      descriptionLang: { type: "string", nullable: true },
      address: { type: "string", nullable: true },
      latitude: { type: "number" },
      longitude: { type: "number" },
      category: { type: "string", nullable: true },
      website: { type: "string", nullable: true },
      phone: { type: "string", nullable: true },
      priceLevel: { type: "integer", nullable: true },
      openingHours: { type: "object", nullable: true, additionalProperties: true },
      photoUrls: { type: "array", items: { type: "string" } },
      createdBy: { type: "string" },
      visibility: { type: "string", enum: ["PRIVATE", "SHARED", "PUBLIC"] },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: [
      "id",
      "name",
      "latitude",
      "longitude",
      "createdBy",
      "visibility",
      "createdAt",
      "updatedAt",
    ],
  },
  ExportMeSavedPoi: {
    type: "object",
    properties: {
      id: { type: "string" },
      poiId: { type: "string", nullable: true },
      googlePlaceId: { type: "string", nullable: true },
      createdAt: { type: "string", format: "date-time" },
    },
    required: ["id", "createdAt"],
  },
  ExportMeOwnedList: {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      description: { type: "string", nullable: true },
      imageUrl: { type: "string", nullable: true },
      visibility: { type: "string", enum: ["PRIVATE", "SHARED", "PUBLIC"] },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      savedPois: {
        type: "array",
        items: { $ref: "#/components/schemas/ExportMeSavedPoi" },
      },
    },
    required: ["id", "name", "visibility", "createdAt", "updatedAt", "savedPois"],
  },
  ExportMeCollaboration: {
    type: "object",
    properties: {
      id: { type: "string" },
      role: { type: "string", enum: ["VIEWER", "EDITOR", "ADMIN", "OWNER"] },
      joinedAt: { type: "string", format: "date-time", nullable: true },
      list: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
        },
        required: ["id", "name"],
      },
    },
    required: ["id", "role", "list"],
  },
  ExportMeSession: {
    type: "object",
    properties: {
      id: { type: "string" },
      expiresAt: { type: "string", format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
    },
    required: ["id", "expiresAt", "createdAt"],
  },
  ExportMeResponse: {
    type: "object",
    properties: {
      exportedAt: { type: "string", format: "date-time" },
      profile: { $ref: "#/components/schemas/ExportMeProfile" },
      createdPois: {
        type: "array",
        items: { $ref: "#/components/schemas/ExportMePoi" },
      },
      ownedLists: {
        type: "array",
        items: { $ref: "#/components/schemas/ExportMeOwnedList" },
      },
      collaborations: {
        type: "array",
        items: { $ref: "#/components/schemas/ExportMeCollaboration" },
      },
      sessions: {
        type: "array",
        items: { $ref: "#/components/schemas/ExportMeSession" },
      },
    },
    required: ["exportedAt", "profile", "createdPois", "ownedLists", "collaborations", "sessions"],
    example: {
      exportedAt: "2026-08-14T12:00:00.000Z",
      profile: {
        id: "1234567890",
        email: "test@example.com",
        name: "John Doe",
        avatarUrl: "https://example.com/avatar.png",
        bio: "I am a test user",
        emailVerified: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      createdPois: [],
      ownedLists: [],
      collaborations: [],
      sessions: [],
    },
  },
} as const;
