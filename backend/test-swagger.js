const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Test',
      version: '1.0.0',
    },
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/dtos/*.ts',
  ],
};

const spec = swaggerJsdoc(options);
console.log(JSON.stringify(spec.paths, null, 2));
