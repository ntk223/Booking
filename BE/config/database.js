import { Sequelize } from "sequelize";
import { env } from "./environment.js";
import logger from "../logger/winston.log.js";
const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASS, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: "mysql",
  logging: false,
});

async function connectToDatabase() {
  try {
    await sequelize.authenticate();
    logger.info(
      `Database connection established successfully. Host: ${env.DB_HOST}:${env.DB_PORT}. Database: ${env.DB_NAME}`
    );
  } catch (error) {
    logger.error("Unable to connect to the database:", error.message);
    logger.error("Please ensure MySQL is running and accessible");
    logger.error(
      `Connection string: ${env.DB_USER}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}\n`
    );
    logger.info("To start database with Docker: docker-compose up -d mysql");
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  connectToDatabase();
}
// await sequelize.sync({ alter: true });

export default sequelize;
