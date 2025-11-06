import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Equipment = sequelize.define("Equipment", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  deletedAt: { type: DataTypes.DATE }
}, {
  tableName: "equipments",
  timestamps: true,
  paranoid: true,
  underscored: true,
});

export default Equipment;
