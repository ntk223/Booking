import { Room, District, Equipment, Booking, sequelize } from "../models/Model.js";
import { Op } from "sequelize";
import { BaseRepository } from "./BaseRepository.js";

class RoomRepository extends BaseRepository {
    constructor() {
        super(Room);
    }

    async createRoom(roomData) {
        const { currentPage } = await this.getPageForNewItem();
        const roomCreated = await this.create(roomData);
        return { roomCreated, currentPage };
    }

    async getRoomDetails(roomId = null, pageNumber) {
        const query = {
            attributes: [
                "id",
                "name",
                "location",
                "capacity",
                "imageUrl",
                "price",
                "districtId",
            ],
            include: [
                {
                    model: District,
                    as: "district",
                    attributes: ["name"],
                },
                {
                    model: Equipment,
                    as: "equipments",
                    attributes: ["name"],
                    through: { attributes: [] },
                    required: false,
                },
            ],
        };

        if (roomId) {
            const room = await this.findById(roomId, query);
            if (!room) return null;
            return this._formatRoom(room);
        } else if (pageNumber) {
            const { data, currentPage, totalPages } = await this.paginate(
                pageNumber,
                query
            );
            return {
                rooms: data.map((room) => this._formatRoom(room)),
                currentPage,
                totalPages,
            };
        }
    }

    _formatRoom(room) {
        return {
            id: room.id,
            name: room.name,
            location: room.location,
            capacity: room.capacity,
            imageUrl: room.imageUrl,
            district: room.district?.name || null,
            districtId: room.districtId,
            equipments: room.equipments ? room.equipments.map((e) => e.name) : [],
            price: room.price,
        };
    }

    async deleteRoom(roomId) {
        const roomBefore = await this.model.findAll({
            where: {
                id: {
                    [Op.lt]: roomId,
                },
            },
        });
        const totalPages = Math.ceil((await this.count()) / this.pageSize);
        const currentPage = Math.ceil((roomBefore.length + 1) / this.pageSize);
        await this.delete(roomId);
        return { totalPages, currentPage };
    }

    async updateRoom(roomId, updatedData) {
        const roomBefore = await this.model.findAll({
            where: {
                id: {
                    [Op.lt]: roomId,
                },
            },
        });
        const currentPage = Math.ceil((roomBefore.length + 1) / this.pageSize);
        await this.update(roomId, updatedData);
        const room = await this.findById(roomId);
        return { room, currentPage };
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
            const rooms = await this.findAll({
                attributes: [
                    "id",
                    "name",
                    "location",
                    "capacity",
                    "price",
                    "imageUrl",
                    [sequelize.literal(`'available'`), "current_status"],
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