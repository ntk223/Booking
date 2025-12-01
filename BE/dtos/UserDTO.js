import { BaseDTO } from "./BaseDTO.js";

export class UserDTO extends BaseDTO {
    constructor(user) {
        super();
        this.id = user.id;
        this.name = user.name;
        this.email = user.email;
        this.phone = user.phone;
        this.role = user.role;
        this.createdAt = user.createdAt;
    }
}
