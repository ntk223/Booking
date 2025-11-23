import {Room, District, Equipment, Booking, sequelize} from "../models/Model.js";
import { Op } from "sequelize";
const PAGE_SIZE = 20;
class RoomRepository {
    async createRoom(roomData) {
        const totalRooms = await Room.count();
        const totalRoomsBeforeAtPage = totalRooms % PAGE_SIZE;
        const currentPage = Math.ceil((totalRooms + 1) / PAGE_SIZE);
        const roomCreated = await Room.create(roomData);
        if (totalRoomsBeforeAtPage === 0 && totalRooms !== 0) {
            // New page created
            return { roomCreated, currentPage: null};
        }
        return { roomCreated, currentPage };
    }

async getRoomDetails(roomId = null, pageNumber) {
    // await new Promise(resolve => setTimeout(resolve, 1000));


  const query = {
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
  }
    if (roomId) { 
        query.where = { id: roomId };
    }
    else if (pageNumber) {
        query.limit = PAGE_SIZE;
        query.offset = (pageNumber - 1) * PAGE_SIZE;
    }
    
  const rooms = await Room.findAll(query);

  return {
    rooms: rooms.map(room => ({
                        id: room.id,
                        name: room.name,
                        location: room.location,
                        capacity: room.capacity,
                        imageUrl: room.imageUrl,
                        district: room.district?.name || null,
                        equipments: room.equipments.map(e => e.name),
                        price: room.price,
                    })),
        currentPage: pageNumber,
        totalPages: Math.ceil(await Room.count() / PAGE_SIZE)
};
}



    async deleteRoom(roomId) {
        const roomBefore = await Room.findAll({
            where :{
                id : {
                    [Op.lt]: roomId
                }
            }
        })
        const totalPages = Math.ceil(await Room.count() / PAGE_SIZE);
        const currentPage = Math.ceil((roomBefore.length + 1) / PAGE_SIZE);
        await Room.destroy({ where: { id: roomId } });
        return { totalPages, currentPage  };
    }

    async updateRoom(roomId, updatedData) {

        const roomBefore = await Room.findAll({
            where :{
                id : {
                    [Op.lt]: roomId
                }
            }
        })
        const currentPage = Math.ceil((roomBefore.length + 1) / PAGE_SIZE);
        return {room : await Room.update(updatedData, { where: { id: roomId } }), currentPage};
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