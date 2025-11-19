import { Sequelize } from "sequelize";
import { env } from "./environment.js";
import { queryProfiler, createSequelizeLogger } from "../utils/queryProfiler.js";

const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASS, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: "mysql",
  logging: createSequelizeLogger(queryProfiler),  // Enable query profiling
  benchmark: true,  // Enable timing
  pool: {
    max: 20,          // Maximum connections in pool
    min: 5,           // Minimum connections in pool
    acquire: 30000,   // Maximum time (ms) to get connection
    idle: 10000,      // Maximum time (ms) connection can be idle
    evict: 1000,      // Check for idle connections every 1s
  },
  retry: {
    max: 3            // Retry failed connections 3 times
  },
  dialectOptions: {
    connectTimeout: 10000  // Connection timeout 10s
  }
});

async function connectToDatabase() {
  try {
    await sequelize.authenticate();
    console.log(" Database connection established successfully");
    console.log(`   Host: ${env.DB_HOST}:${env.DB_PORT}`);
    console.log(`   Database: ${env.DB_NAME}`);
    console.log(`   Connection Pool: ${sequelize.config.pool.min}-${sequelize.config.pool.max} connections\n`);
  } catch (error) {
    console.error(" Unable to connect to the database:", error);
    process.exit(1);
  }
}

connectToDatabase();

// Export query profiler for reporting
export { queryProfiler };
export default sequelize;


