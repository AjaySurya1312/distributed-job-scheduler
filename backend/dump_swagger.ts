import { swaggerSpec } from './src/config/swagger';
import * as fs from 'fs';
fs.writeFileSync('swagger_output.json', JSON.stringify(swaggerSpec, null, 2));
console.log('Done!');
