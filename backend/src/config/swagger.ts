import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nirby API',
      version: '1.0.0',
      description: 'API for Nirby - Platform to save, organize and share places and activities',
      contact: {
        name: 'Nirby Team',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/server.ts', './dist/routes/*.js', './dist/server.js'], // Chemins vers fichiers sources (.ts) et compilés (.js)
};

export const swaggerSpec = swaggerJsdoc(options);
