/**
 * List-related OpenAPI schemas
 * These schemas define the structure of list-related API responses
 */

export const listSchemas = {
  List: {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      description: { type: "string", nullable: true },
      visibility: { type: "string", enum: ["PRIVATE", "SHARED", "PUBLIC"] },
      createdBy: { type: "string" },
      imageUrl: { type: "string", format: "uri", nullable: true },
      shareToken: { type: "string", nullable: true },
      shareTokenExpiresAt: { type: "string", format: "date-time", nullable: true },
      editToken: { type: "string", nullable: true },
      editTokenExpiresAt: {
        type: "string",
        format: "date-time",
        nullable: true,
        description: "The date and time the edit token expires",
      },
    },
    required: [
      "id",
      "name",
      "createdAt",
      "updatedAt",
      "description",
      "visibility",
      "createdBy",
      "imageUrl",
      "shareToken",
      "shareTokenExpiresAt",
      "editToken",
      "editTokenExpiresAt",
    ],
    example: {
      id: "1234567890",
      name: "My List",
      createdAt: "2021-01-01T00:00:00.000Z",
      updatedAt: "2021-01-01T00:00:00.000Z",
      description: "This is a list of my favorite places",
      visibility: "PRIVATE",
      createdBy: "1234567890",
      imageUrl: "https://example.com/image.jpg",
      shareToken: "1234567890",
      shareTokenExpiresAt: "2021-01-01T00:00:00.000Z",
      editToken: "1234567890",
      editTokenExpiresAt: "2021-01-01T00:00:00.000Z",
    },
  },
  ListWithRole: {
    type: "object",
    allOf: [
      { $ref: "#/components/schemas/List" },
      {
        type: "object",
        properties: {
          role: { type: "string", enum: ["OWNER", "EDITOR", "VIEWER", "ADMIN"] },
        },
      },
    ],
  },
  GetListsResponse: {
    type: "object",
    properties: {
      lists: { type: "array", items: { $ref: "#/components/schemas/ListWithRole" } },
      pagination: { $ref: "#/components/schemas/PaginationResponse" },
    },
    required: ["lists", "pagination"],
  },
  CreateListResponse: {
    type: "object",
    properties: {
      list: { $ref: "#/components/schemas/List" },
    },
    required: ["list"],
  },
  GetListResponse: {
    type: "object",
    properties: {
      list: { $ref: "#/components/schemas/List" },
    },
    required: ["list"],
  },
  UpdateListResponse: {
    type: "object",
    properties: {
      list: { $ref: "#/components/schemas/List" },
    },
    required: ["list"],
  },
  Collaborator: {
    type: "object",
    properties: {
      role: { type: "string", enum: ["EDITOR", "VIEWER", "ADMIN"] },
      joinedAt: { type: "string", format: "date-time" },
      user: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string", format: "email" },
          name: { type: "string", nullable: true },
          avatarUrl: { type: "string", format: "uri", nullable: true },
        },
        required: ["id", "email"],
      },
    },
    required: ["role", "joinedAt", "user"],
  },
  GetCollaboratorsResponse: {
    type: "object",
    properties: {
      collaborators: {
        type: "array",
        items: { $ref: "#/components/schemas/Collaborator" },
      },
    },
    required: ["collaborators"],
  },
  InviteCollaboratorResponse: {
    type: "object",
    properties: {
      inviteLink: { type: "string", format: "uri" },
      emailSent: { type: "boolean" },
    },
    required: ["inviteLink", "emailSent"],
  },
  JoinListResponse: {
    type: "object",
    properties: {
      message: { type: "string" },
      list: { $ref: "#/components/schemas/List" },
    },
    required: ["list"],
  },
} as const;
