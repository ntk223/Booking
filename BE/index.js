import express from 'express'
import { APIs } from './routes/index.js'
// import sequelize from './config/database.js'
import { env } from './config/environment.js'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware.js'
import { corsOptions } from './config/cors.js'
// import { swaggerDocs } from './config/swagger.js'
import cors from 'cors'
import { metricsMiddleware, metricsEndpoint } from './utils/metrics.js';

const START_SERVER = () => {
    
    const app = express ()
    app.use (cors(corsOptions))
    app.use (express.json())
    // --- Metrics middleware ---
    app.use(metricsMiddleware);
    app.get("/metrics", metricsEndpoint);
    app.use ('/api', APIs)

    
    // --- End metrics ---

    // Xử lý lỗi tập trung trong ứng dụng
    app.use (errorHandlingMiddleware)
    // Tài liệu API với Swagger
    // swaggerDocs (app)
    // Kết nối Database
    app.listen(env.APP_PORT, () => {
        console.log(`Server is running on port ${env.APP_PORT}`)
    })

}

START_SERVER ()