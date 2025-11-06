import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const District = sequelize.define("District", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  deletedAt: { type: DataTypes.DATE }
}, {
  tableName: "districts",
  timestamps: true,
  paranoid: true,
  underscored: true,
});

export default District;
