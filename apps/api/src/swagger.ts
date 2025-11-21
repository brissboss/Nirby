import swaggerJsdoc from "swagger-jsdoc";

export const SwaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Nirby staging API",
      version: "0.0.1",
      description: "Staging API for the Nirby application",
    },
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
  // En dev, scan les fichiers .ts, en prod scan les .js compilés
  apis: process.env.NODE_ENV === "production" ? ["./dist/**/*.js"] : ["./src/**/*.ts"],
});
