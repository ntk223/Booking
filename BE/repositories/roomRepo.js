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

    async searchRooms(criteria) {
        const { capacity, districtId, searchDate, startTime, endTime } = criteria;

        try {
            const include = [
                {
                    model: District,
                    as: "district",
                    attributes: ["name"],
                },
            ];

            const where = {};
            if (capacity) where.capacity = { [Op.gte]: capacity };
            if (districtId) where.districtId = districtId;

            // Only check availability if date and time are provided
            if (searchDate && startTime && endTime) {
                const literal = sequelize.literal(`
                    NOT EXISTS (
                        SELECT 1
                        FROM bookings AS b
                        WHERE b.room_id = \`Room\`.\`id\`
                        AND b.date = ${sequelize.escape(searchDate)}
                        AND b.status != 'cancelled'
                        AND b.start_time < ${sequelize.escape(endTime)}
                        AND b.end_time > ${sequelize.escape(startTime)}
                        AND b.deleted_at IS NULL
                    )
                `);
                where[Op.and] = literal;
            }

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
                include: include,
                where: where,
            });

            return rooms.map((room) => ({
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