import swaggerJsdoc from "swagger-jsdoc";

export const SwaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Nirby API",
      version: "1.0.0",
      description: "API for the Nirby application",
    },
  },
  apis: ["./src/**/*.ts"],
});
