import { Sequelize, DataTypes, Op } from "sequelize";

const sequelize = new Sequelize("sqlite::memory:", {
  logging: false,
  dialectOptions: {
    timezone: "+07:00",
  },
});

const District = sequelize.define("District", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const Equipment = sequelize.define("Equipment", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const Room = sequelize.define("Room", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  districtId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: District,
      key: "id",
    },
  },
});

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

const RoomEquipment = sequelize.define("RoomEquipment", {
  roomId: {
    type: DataTypes.INTEGER,
    references: {
      model: Room,
      key: "id",
    },
  },
  equipmentId: {
    type: DataTypes.INTEGER,
    references: {
      model: Equipment,
      key: "id",
    },
  },
});

const Booking = sequelize.define(
  "Booking",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    roomId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "room_id",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: "start_time",
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: "end_time",
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    tableName: "bookings",
    paranoid: true,
    deletedAt: "deleted_at",
  }
);

Room.belongsTo(District, { foreignKey: "districtId", as: "district" });
District.hasMany(Room, { foreignKey: "districtId", as: "rooms" });

Room.belongsToMany(Equipment, {
  through: RoomEquipment,
  foreignKey: "roomId",
  otherKey: "equipmentId",
  as: "equipments",
});

Equipment.belongsToMany(Room, {
  through: RoomEquipment,
  foreignKey: "equipmentId",
  otherKey: "roomId",
  as: "rooms",
});

Room.hasMany(Booking, { foreignKey: "roomId", as: "bookings" });
Booking.belongsTo(Room, { foreignKey: "roomId", as: "room" });
Booking.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(Booking, { foreignKey: "userId", as: "bookings" });

class BaseRepository {
  constructor(model) {
    this.model = model;
    this.pageSize = 10;
  }

  async findAll(options = {}) {
    return await this.model.findAll(options);
  }

  async findById(id, options = {}) {
    return await this.model.findByPk(id, options);
  }

  async create(data, options = {}) {
    return await this.model.create(data, options);
  }

  async update(id, data, options = {}) {
    const [affectedCount] = await this.model.update(data, {
      where: { id },
      ...options,
    });
    return affectedCount;
  }

  async delete(id, options = {}) {
    return await this.model.destroy({
      where: { id },
      ...options,
    });
  }

  async count(options = {}) {
    return await this.model.count(options);
  }

  async paginate(page = 1, options = {}) {
    const limit = this.pageSize;
    const offset = (page - 1) * limit;

    const { count, rows } = await this.model.findAndCountAll({
      ...options,
      limit,
      offset,
    });

    return {
      data: rows,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalItems: count,
    };
  }

  async getPageForNewItem() {
    const totalItems = await this.count();
    return {
      currentPage: Math.ceil((totalItems + 1) / this.pageSize),
    };
  }
}

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
      price: parseFloat(room.price),
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
        price: parseFloat(room.price),
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

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async createUser(userData) {
    const emailExists = await this.model.findOne({
      where: { email: userData.email },
    });
    if (emailExists) {
      throw new Error("Email already in use.");
    }
    return await this.create(userData);
  }

  async getAllUsers() {
    return await this.findAll();
  }

  async deleteUser(userId) {
    if (userId === undefined || userId === null) {
      return 0;
    }
    return await this.delete(userId);
  }

  async updateUser(userId, updatedData) {
    return await this.update(userId, updatedData);
  }

  async login(email, password) {
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const user = await this.model.findOne({ where: { email: email } });
    if (!user) {
      throw new Error("User not found.");
    }

    const isPasswordValid = user.password === password;
    if (!isPasswordValid) {
      throw new Error("Invalid password.");
    }

    const token = "mock_jwt_token_" + user.id; // Mock token generation
    return { user, token };
  }
}

class BookingRepository extends BaseRepository {
  constructor() {
    super(Booking);
  }

  async createBooking(bookingData, transaction) {
    return await this.create(bookingData, { transaction });
  }

  async getBookingDetails(bookingId = null) {
    const whereClause =
      bookingId !== null && bookingId !== undefined ? { id: bookingId } : {};
    const bookings = await this.findAll({
      attributes: [
        "id",
        "date",
        "startTime",
        "endTime",
        "status",
        "createdAt",
        "roomId",
        "userId",
      ],
      include: [
        {
          model: Room,
          as: "room",
          attributes: ["name"],
        },
        {
          model: User,
          as: "user",
          attributes: ["name"],
        },
      ],
      where: whereClause,
      raw: true,
      nest: true,
    });

    // Format result
    return bookings.map((b) => ({
      bookingId: b.id,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
      createdAt: b.createdAt,
      roomId: b.roomId,
      roomName: b.room?.name || null,
      userId: b.userId,
      userName: b.user?.name || null,
    }));
  }

  async updateBookingStatus(bookingId, status) {
    const affectedCount = await this.update(bookingId, { status: status });
    return [affectedCount];
  }

  async getBookingsByUserId(userId) {
    const bookings = await this.findAll({
      attributes: [
        "id",
        "date",
        "startTime",
        "endTime",
        "status",
        "createdAt",
        "roomId",
        "userId",
      ],
      include: [
        {
          model: Room,
          as: "room",
          attributes: ["name"],
        },
        {
          model: User,
          as: "user",
          attributes: ["name"],
        },
      ],
      where: { userId: userId },
      raw: true,
      nest: true,
    });

    return bookings.map((b) => ({
      bookingId: b.id,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
      createdAt: b.createdAt,
      roomId: b.roomId,
      roomName: b.room?.name || null,
      userId: b.userId,
      userName: b.user?.name || null,
    }));
  }
}

// Database setup utilities
export const setupTestDatabase = async () => {
  await sequelize.sync({ force: true });
};

export const seedTestData = async () => {
  // Seed base data
  await District.bulkCreate([
    { id: 1, name: "District 1" },
    { id: 2, name: "District 2" },
    { id: 3, name: "District 3" },
  ]);

  await Equipment.bulkCreate([
    { id: 1, name: "Projector" },
    { id: 2, name: "Whiteboard" },
    { id: 3, name: "Audio System" },
  ]);
};

export const cleanTestData = async () => {
  await Booking.destroy({ where: {}, force: true });
  await RoomEquipment.destroy({ where: {} });
  await Room.destroy({ where: {}, force: true });
  await Equipment.destroy({ where: {}, force: true });
  await District.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });
};

export const closeTestDatabase = async () => {
  await sequelize.close();
};

export const setupDatabase = async () => {
  await sequelize.sync({ force: true });
};

export const cleanupDatabase = async () => {
  await sequelize.close();
};

export {
  sequelize,
  District,
  Equipment,
  Room,
  User,
  RoomEquipment,
  Booking,
  BaseRepository,
  RoomRepository,
  UserRepository,
  BookingRepository,
  Op,
};
