import { Sequelize } from "sequelize";
import { env } from "./environment.js";
const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASS, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: "mysql",
  logging: false,  
});

async function connectToDatabase() {
  try {
    await sequelize.authenticate();
    console.log("[INFO] Database connection established successfully");
    console.log(`   Host: ${env.DB_HOST}:${env.DB_PORT}`);
    console.log(`   Database: ${env.DB_NAME}\n`);
  } catch (error) {
    console.error("[ERROR] Unable to connect to the database:", error.message);
    console.error("[ERROR] Please ensure MySQL is running and accessible");
    console.error(`[ERROR] Connection string: ${env.DB_USER}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}\n`);
    console.log("[INFO] To start database with Docker:");
    console.log("   docker-compose up -d mysql\n");
    process.exit(1);
  }
}

connectToDatabase();
// await sequelize.sync({ alter: true });

export default sequelize;