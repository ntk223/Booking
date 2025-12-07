import { Sequelize } from "sequelize";
import { env } from "./environment.js";
import logger from "../logger/winston.log.js";
const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASS, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: "mysql",
  logging: false,
  // Performance optimizations
  pool: {
    max: 20,          // Maximum connections in pool
    min: 5,           // Minimum connections in pool
    acquire: 30000,   // Max time to acquire connection
    idle: 10000,      // Max time before idle connection is released
  },
  dialectOptions: {
    connectTimeout: 10000,
  },
});

async function connectToDatabase() {
  try {
    await sequelize.authenticate();
    logger.info(
      `Database connection established successfully. Host: ${env.DB_HOST}:${env.DB_PORT}. Database: ${env.DB_NAME}`
    );
  } catch (error) {
    logger.error("Unable to connect to the database:", error.message);
    logger.error("Retrying in 5 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return connectToDatabase();
  }
}

if (process.env.NODE_ENV !== 'test') {
  connectToDatabase();
}
await sequelize.sync({ alter: true });

export default sequelize;
