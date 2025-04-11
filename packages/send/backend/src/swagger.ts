import swaggerJSDoc from 'swagger-jsdoc';
import { VERSION } from './config';

export const openapiSpecification = swaggerJSDoc({
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Send API',
      version: VERSION,
      description: 'API thunderbird send',
    },
  },
  apis: ['./src/routes/*.ts', './src/index.ts', './src/trpc/*.ts'],
});
