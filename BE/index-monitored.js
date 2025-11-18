import express from 'express'
import expressStatusMonitor from 'express-status-monitor'
import { APIs } from './routes/index.js'
import { env } from './config/environment.js'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware.js'
import { performanceMiddlewareWithStats, performanceStats } from './middlewares/performanceMiddleware.js'
import { corsOptions } from './config/cors.js'
import cors from 'cors'

const START_SERVER = () => {
    
    const app = express ()

    // Real-time monitoring dashboard
    app.use(expressStatusMonitor({
        title: 'Booking System Performance Monitor',
        path: '/status',
        spans: [{
            interval: 1,     // Every second
            retention: 60    // Keep 60 datapoints
        }],
        chartVisibility: {
            cpu: true,
            mem: true,
            load: true,
            responseTime: true,
            rps: true,
            statusCodes: true
        },
        healthChecks: [{
            protocol: 'http',
            host: 'localhost',
            path: '/api/room',
            port: env.APP_PORT
        }]
    }))

    // Performance monitoring middleware
    app.use(performanceMiddlewareWithStats)

    app.use (cors(corsOptions))
    app.use (express.json())

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'OK',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            memory: {
                heapUsed: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
                heapTotal: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2) + ' MB',
                rss: (process.memoryUsage().rss / 1024 / 1024).toFixed(2) + ' MB'
            }
        })
    })

    // Performance stats endpoint
    app.get('/metrics', (req, res) => {
        const stats = performanceStats.getStats()
        const topSlow = performanceStats.getTopSlowEndpoints(10)
        
        res.status(200).json({
            stats,
            topSlowEndpoints: topSlow,
            timestamp: new Date().toISOString()
        })
    })

    app.use ('/api', APIs)

    // Xử lý lỗi tập trung trong ứng dụng
    app.use (errorHandlingMiddleware)

    // Kết nối Database
    const server = app.listen(env.APP_PORT, () => {
        console.log(`\n===============================================`)
        console.log(`|      Booking System Server Started         |`)
        console.log(`===============================================\n`)
        console.log(` API Server: http://localhost:${env.APP_PORT}`)
        console.log(` Monitoring Dashboard: http://localhost:${env.APP_PORT}/status`)
        console.log(` Health Check: http://localhost:${env.APP_PORT}/health`)
        console.log(` Metrics: http://localhost:${env.APP_PORT}/metrics\n`)
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

START_SERVER ()


