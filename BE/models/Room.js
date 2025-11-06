import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Room = sequelize.define("Room", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  location: { type: DataTypes.STRING(255) },
  capacity: { type: DataTypes.INTEGER },
  status: { type: DataTypes.ENUM("available", "unavailable"), defaultValue: "available" },
  districtId: { type: DataTypes.INTEGER },
  price: { type: DataTypes.INTEGER },
  imageUrl: { type: DataTypes.TEXT },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  deletedAt: { type: DataTypes.DATE }
}, {
  tableName: "rooms",
  timestamps: true,
  paranoid: true,
  underscored: true,
});

export default Room;
