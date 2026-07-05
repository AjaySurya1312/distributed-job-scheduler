const express = require('express');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');

const app = express();
const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, 'swagger_output.json'), 'utf8'));

app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(3001, () => {
    console.log('Swagger UI available at http://localhost:3001');
});
