import express from 'express'
import { APIs } from './routes/index.js'
// import sequelize from './config/database.js'
import { env } from './config/environment.js'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware.js'
import { corsOptions } from './config/cors.js'
// import { swaggerDocs } from './config/swagger.js'
import cors from 'cors'
import { healthChecker } from './utils/HealthChecker.js'
import safeRedisClient from './config/redis.js'

const START_SERVER = () => {

    const app = express()
    app.use(cors(corsOptions))
    app.use(express.json())

    // Health check endpoints (before API routes for fast response)

    // Shallow health check (fast, for load balancers)
    app.get('/health', async (req, res) => {
        const health = await healthChecker.checkShallow();
        const statusCode = healthChecker.getStatusCode(health);
        res.status(statusCode).json(health);
    });

    // Deep health check (thorough, for monitoring dashboards)
    app.get('/health/deep', async (req, res) => {
        const health = await healthChecker.checkDeep();
        const statusCode = healthChecker.getStatusCode(health);
        res.status(statusCode).json(health);
    });

    // Circuit breaker status endpoint
    app.get('/health/circuits', (req, res) => {
        const redisCircuitStatus = safeRedisClient.getCircuitStatus();

        res.status(200).json({
            timestamp: new Date().toISOString(),
            circuits: {
                redis: redisCircuitStatus
            }
        });
    });

    app.use('/api', APIs)

    // Xử lý lỗi tập trung trong ứng dụng
    app.use(errorHandlingMiddleware)
    // Tài liệu API với Swagger
    // swaggerDocs (app)
    // Kết nối Database
    const server = app.listen(env.APP_PORT, () => {
        console.log(`\n===============================================`)
        console.log(`|    Booking System Server Started           |`)
        console.log(`===============================================\n`)
        console.log(` API Server: http://localhost:${env.APP_PORT}`)
        console.log(` Health Check: http://localhost:${env.APP_PORT}/health`)
        console.log(` Deep Health Check: http://localhost:${env.APP_PORT}/health/deep`)
        console.log(` Circuit Breaker Status: http://localhost:${env.APP_PORT}/health/circuits\n`)
    })

    // Graceful shutdown
    const gracefulShutdown = () => {
        console.log('\n  Received shutdown signal, starting graceful shutdown...')

        server.close(() => {
            console.log(' HTTP server closed')
            console.log(' Graceful shutdown completed')
            process.exit(0)
        })

        // Force shutdown after 30 seconds
        setTimeout(() => {
            console.error(' Forcing shutdown after timeout')
            process.exit(1)
        }, 30000)
    }

    process.on('SIGTERM', gracefulShutdown)
    process.on('SIGINT', gracefulShutdown)
}

START_SERVER()