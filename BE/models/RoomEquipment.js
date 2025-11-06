import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const RoomEquipment = sequelize.define("RoomEquipment", {
  roomId: { type: DataTypes.INTEGER, primaryKey: true },
  equipmentId: { type: DataTypes.INTEGER, primaryKey: true },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  deletedAt: { type: DataTypes.DATE }
}, {
  tableName: "room_equipments",
  timestamps: true,
  underscored: true,
});

export default RoomEquipment;
