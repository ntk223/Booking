import { BaseDTO } from "./BaseDTO.js";

export class RoomDTO extends BaseDTO {
    constructor(room) {
        super();
        this.id = room.id;
        this.name = room.name;
        this.location = room.location;
        this.capacity = room.capacity;
        this.imageUrl = room.imageUrl;
        this.price = room.price;
        this.district = room.district?.name || null;
        this.districtId = room.districtId;
        this.equipments = room.equipments ? room.equipments.map((e) => e.name) : [];
    }
}
