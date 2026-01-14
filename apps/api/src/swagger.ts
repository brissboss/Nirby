import swaggerJsdoc from "swagger-jsdoc";

export const SwaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Nirby API",
      version: "0.0.1",
      description: "API for the Nirby application",
    },
    tags: [
      // Auth
      { name: "🔐 Auth", description: "Authentication & user management" },

      // Upload
      { name: "📂 Upload", description: "File upload endpoints" },

      // POI
      { name: "📍 POI", description: "Points of Interest (custom)" },

      // Google Places
      { name: "🌍 Google Places", description: "Google Places API integration" },

      // List
      { name: "Core", description: "List CRUD operations" },
      { name: "POI", description: "Manage POIs in lists" },
      { name: "Sharing", description: "Share lists (read-only & edit links)" },
      { name: "Collaborators", description: "Manage list collaborators" },
      { name: "Shared Access", description: "Public access to shared lists" },

      // Health
      { name: "❤️ Health", description: "Health check endpoints" },
    ],

    "x-tagGroups": [
      // Groupe Auth
      {
        name: "🔑 Authentication & Core",
        tags: ["🔐 Auth", "❤️ Health", "📤 Upload"],
      },

      // Groupe POI & Google Places
      {
        name: "🏞️ POI Management",
        tags: ["📍 POI", "🌍 Google Places"],
      },

      // Groupe List Management
      {
        name: "📝 List Management",
        tags: ["Core", "POI", "Sharing", "Collaborators", "Shared Access"],
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: process.env.NODE_ENV === "development" ? ["./src/**/*.ts"] : ["./dist/**/*.js"],
});
