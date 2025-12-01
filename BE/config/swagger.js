import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { env } from './environment.js';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Booking System API',
            version: '1.0.0',
            description: 'API documentation for the Booking System',
        },
        servers: [
            {
                url: `http://localhost:${env.APP_PORT}/api`,
                description: 'Local server',
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
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

export const swaggerDocs = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
    console.log(`Swagger docs available at http://localhost:${env.APP_PORT}/api-docs`);
};
