import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Booking = sequelize.define("Booking", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  roomId: { type: DataTypes.INTEGER, allowNull: false },
  startTime: { type: DataTypes.TIME, allowNull: false },
  endTime: { type: DataTypes.TIME, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  purpose: { type: DataTypes.STRING(255) },
  status: { type: DataTypes.ENUM("pending", "confirmed", "cancelled"), defaultValue: "pending" },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  deletedAt: { type: DataTypes.DATE }
}, {
  tableName: "bookings",
  timestamps: true,
  paranoid: true,
  underscored: true,
});

export default Booking;
