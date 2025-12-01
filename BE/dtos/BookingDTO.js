import { BaseDTO } from "./BaseDTO.js";

export class BookingDTO extends BaseDTO {
    constructor(booking) {
        super();
        this.id = booking.id;
        this.roomId = booking.roomId;
        this.userId = booking.userId;
        this.date = booking.date;
        this.startTime = booking.startTime;
        this.endTime = booking.endTime;
        this.status = booking.status;
        this.totalPrice = booking.totalPrice;
        this.roomName = booking.room?.name || null;
        this.userName = booking.user?.name || null;
    }
}
