import User from "./User.js";
import District from "./District.js";
import Equipment from "./Equipment.js";
import RoomEquipment from "./RoomEquipment.js";
import Room from "./Room.js";
import Booking from "./Booking.js";
import sequelize from "../config/database.js";
// Define associations here if needed
User.hasMany(Booking, { foreignKey: "userId", as : "bookings" });
Booking.belongsTo(User, { foreignKey: "userId", as : "user" });

Room.hasMany(Booking, { foreignKey: "roomId", as : "bookings" });
Booking.belongsTo(Room, { foreignKey: "roomId", as : "room" });

Room.belongsToMany(Equipment, {
  through: RoomEquipment,
  foreignKey: "roomId",
  as: "equipments"
});

Equipment.belongsToMany(Room, {
  through: RoomEquipment,
  foreignKey: "equipmentId",
  as: "rooms"
});

Room.belongsTo(District, { foreignKey: "districtId", as: "district" });
District.hasMany(Room, { foreignKey: "districtId", as: "rooms" });

export {
  User,
  District,
  Equipment,
  RoomEquipment,
  Room,
  Booking,
  sequelize
};
