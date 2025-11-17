import {Room, District, Equipment, Booking, sequelize} from "../models/Model.js";
import { Op } from "sequelize";
class RoomRepository {
    async createRoom(roomData) {
        return await Room.create(roomData);
    }

async getRoomDetails(roomId = null) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  const whereClause = roomId ? { id: roomId } : {};

  const rooms = await Room.findAll({
    attributes: ['id', 'name', 'location', 'capacity', 'imageUrl', 'price'],
    include: [
      {
        model: District,
        as: 'district',
        attributes: ['name'],
      },
      {
        model: Equipment,
        as: 'equipments',
        attributes: ['name'],
        through: { attributes: [] },
        required: false,
      },
    ],
    where: whereClause,
  });

  return rooms.map(room => ({
    id: room.id,
    name: room.name,
    location: room.location,
    capacity: room.capacity,
    imageUrl: room.imageUrl,
    district: room.district?.name || null,
    equipments: room.equipments.map(e => e.name),
    price: room.price,
  }));
}



    async deleteRoom(roomId) {
        return await Room.destroy({ where: { id: roomId } });
    }

    async updateRoom(roomId, updatedData) {
        return await Room.update(updatedData, { where: { id: roomId } });
    }

    /**
        testCriteria = {
            "capacity": "50",
            "districtId": "2",
            "searchDate": "2024-07-20",
            "startTime": "10:00",
            "endTime": "12:00"
        };
     */
    async searchRooms(criteria) {
        const { capacity, districtId, searchDate, startTime, endTime } = criteria;

          try {
                const rooms = await Room.findAll({
                attributes: [
                    "id",
                    "name",
                    "location",
                    "capacity",
                    "price",
                    "imageUrl",
                    [sequelize.literal(`'available'`), "current_status"]
                ],
                include: [
                    {
                        model: District,
                        as: "district",
                        attributes: ["name"],
                    },
                    {
                    model: Booking,
                    as: "bookings",
                    required: false, // LEFT JOIN
                    where: {
                        date: searchDate,
                        status: { [Op.ne]: "cancelled" },
                        [Op.or]: [
                        {
                            [Op.and]: [
                            { start_time: { [Op.lt]: endTime } },
                            { end_time: { [Op.gt]: startTime } },
                            ],
                        },
                        {
                            [Op.and]: [
                            { start_time: { [Op.lt]: startTime } },
                            { end_time: { [Op.gt]: endTime } },
                            ],
                        },
                        {
                            [Op.and]: [
                            { start_time: { [Op.lte]: startTime } },
                            { end_time: { [Op.gte]: endTime } },
                            ],
                        },
                        ],
                    },
                    },
                ],
                where: {
                    capacity: { [Op.gte]: capacity },
                    district_id: districtId,
                },
                });

                // Lọc lại: loại bỏ phòng có booking trùng giờ
                const availableRooms = rooms.filter((room) => room.bookings.length === 0);

                // Định dạng kết quả
                return availableRooms.map((room) => ({
                id: room.id,
                name: room.name,
                location: room.location,
                capacity: room.capacity,
                price: room.price,
                current_status: "available",
                district_name: room.district?.name || null,
                imageUrl: room.imageUrl,
                }));
            } catch (err) {
                console.error(err);
                throw err;
            }
    }
}
export const roomRepo = new RoomRepository();