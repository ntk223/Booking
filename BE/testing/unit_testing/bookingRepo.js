import {
  setupDatabase,
  cleanupDatabase,
  Booking,
  Room,
  User,
  District,
  BookingRepository,
} from "../setup/mockDatabase.js";

describe("BookingRepository - Boundary Testing", () => {
  let bookingRepo;
  let testUser;
  let testRoom;
  let testDistrict;

  beforeAll(async () => {
    await setupDatabase();
    bookingRepo = new BookingRepository();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  beforeEach(async () => {
    await Booking.destroy({ where: {}, force: true });
    await Room.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await District.destroy({ where: {}, force: true });

    testDistrict = await District.create({
      name: "Test District",
      description: "Test District Description",
    });

    testUser = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      phone: "1234567890",
      role: "user",
    });

    testRoom = await Room.create({
      name: "Test Room",
      location: "Test Location",
      capacity: 10,
      price: 50000,
      districtId: testDistrict.id,
    });
  });

  describe("createBooking - Boundary Testing", () => {
    test("CB_BD1: min- roomId", async () => {
      const bookingData = {
        roomId: -1,
        userId: testUser.id,
        date: "2025-12-15",
        startTime: "09:00:00",
        endTime: "11:00:00",
        status: "confirmed",
      };

      await expect(bookingRepo.createBooking(bookingData)).rejects.toThrow();
    });

    test("CB_BD2: min roomId", async () => {
      const bookingData = {
        roomId: 0,
        userId: testUser.id,
        date: "2025-12-15",
        startTime: "09:00:00",
        endTime: "11:00:00",
        status: "confirmed",
      };

      await expect(bookingRepo.createBooking(bookingData)).rejects.toThrow();
    });

    test("CB_BD3: min+ roomId", async () => {
      const bookingData = {
        roomId: 1,
        userId: testUser.id,
        date: "2025-12-15",
        startTime: "09:00:00",
        endTime: "11:00:00",
        status: "confirmed",
      };

      try {
        const result = await bookingRepo.createBooking(bookingData);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test("CB_BD4: nom roomId (valid)", async () => {
      const bookingData = {
        roomId: testRoom.id,
        userId: testUser.id,
        date: "2025-12-15",
        startTime: "09:00:00",
        endTime: "11:00:00",
        status: "confirmed",
      };

      const result = await bookingRepo.createBooking(bookingData);
      expect(result.roomId).toBe(testRoom.id);
      expect(result.userId).toBe(testUser.id);
      expect(result.status).toBe("confirmed");
    });

    test("CB_BD5: max- roomId", async () => {
      const bookingData = {
        roomId: 2147483646,
        userId: testUser.id,
        date: "2025-12-15",
        startTime: "09:00:00",
        endTime: "11:00:00",
        status: "confirmed",
      };

      await expect(bookingRepo.createBooking(bookingData)).rejects.toThrow();
    });

    test("CB_BD6: max roomId", async () => {
      const bookingData = {
        roomId: 2147483647,
        userId: testUser.id,
        date: "2025-12-15",
        startTime: "09:00:00",
        endTime: "11:00:00",
        status: "confirmed",
      };

      await expect(bookingRepo.createBooking(bookingData)).rejects.toThrow();
    });

    test("CB_BD7: max+ roomId", async () => {
      const bookingData = {
        roomId: 2147483648,
        userId: testUser.id,
        date: "2025-12-15",
        startTime: "09:00:00",
        endTime: "11:00:00",
        status: "confirmed",
      };

      await expect(bookingRepo.createBooking(bookingData)).rejects.toThrow();
    });

    test("CB_BD8: null roomId", async () => {
      const bookingData = {
        roomId: null,
        userId: testUser.id,
        date: "2025-12-15",
        startTime: "09:00:00",
        endTime: "11:00:00",
        status: "confirmed",
      };

      await expect(bookingRepo.createBooking(bookingData)).rejects.toThrow();
    });
  });

  describe("getBookingDetails - Boundary Testing", () => {
    let testBookingIds = [];

    beforeEach(async () => {
      const bookings = await Booking.bulkCreate([
        {
          roomId: testRoom.id,
          userId: testUser.id,
          date: "2025-12-15",
          startTime: "09:00:00",
          endTime: "10:00:00",
          status: "confirmed",
        },
        {
          roomId: testRoom.id,
          userId: testUser.id,
          date: "2025-12-16",
          startTime: "11:00:00",
          endTime: "12:00:00",
          status: "pending",
        },
      ]);
      testBookingIds = bookings.map((b) => b.id);
    });

    test("GBD_BD1: min- bookingId", async () => {
      const result = await bookingRepo.getBookingDetails(-1);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test("GBD_BD2: min bookingId", async () => {
      const result = await bookingRepo.getBookingDetails(0);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test("GBD_BD3: min+ bookingId", async () => {
      const result = await bookingRepo.getBookingDetails(1);

      expect(Array.isArray(result)).toBe(true);
    });

    test("GBD_BD4: nom bookingId ", async () => {
      const result = await bookingRepo.getBookingDetails(testBookingIds[0]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].bookingId).toBe(testBookingIds[0]);
      expect(result[0].roomName).toBe("Test Room");
      expect(result[0].userName).toBe("Test User");
    });

    test("GBD_BD5: max- bookingId", async () => {
      const result = await bookingRepo.getBookingDetails(2147483646);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test("GBD_BD6: max bookingId", async () => {
      const result = await bookingRepo.getBookingDetails(2147483647);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test("GBD_BD7: max+ bookingId", async () => {
      const result = await bookingRepo.getBookingDetails(2147483648);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test("GBD_BD8: null bookingId (get all bookings)", async () => {
      const result = await bookingRepo.getBookingDetails(null);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    test("GBD_BD9: undefined bookingId (get all bookings)", async () => {
      const result = await bookingRepo.getBookingDetails(undefined);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  describe("updateBookingStatus - Boundary Testing", () => {
    let testBookingId;

    beforeEach(async () => {
      const booking = await Booking.create({
        roomId: testRoom.id,
        userId: testUser.id,
        date: "2025-12-15",
        startTime: "09:00:00",
        endTime: "10:00:00",
        status: "pending",
      });
      testBookingId = booking.id;
    });

    test("UBS_BD1: min- bookingId", async () => {
      const result = await bookingRepo.updateBookingStatus(-1, "confirmed");

      expect(result[0]).toBe(0);
    });

    test("UBS_BD2: min bookingId", async () => {
      const result = await bookingRepo.updateBookingStatus(0, "confirmed");

      expect(result[0]).toBe(0);
    });

    test("UBS_BD3: min+ bookingId", async () => {
      const result = await bookingRepo.updateBookingStatus(1, "confirmed");

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toBeGreaterThanOrEqual(0);
    });

    test("UBS_BD4: nom bookingId", async () => {
      const result = await bookingRepo.updateBookingStatus(
        testBookingId,
        "confirmed"
      );

      expect(result[0]).toBe(1);

      const updatedBooking = await Booking.findByPk(testBookingId);
      expect(updatedBooking.status).toBe("confirmed");
    });

    test("UBS_BD5: max- bookingId", async () => {
      const result = await bookingRepo.updateBookingStatus(
        2147483646,
        "confirmed"
      );

      expect(result[0]).toBe(0);
    });

    test("UBS_BD6: max bookingId", async () => {
      const result = await bookingRepo.updateBookingStatus(
        2147483647,
        "confirmed"
      );

      expect(result[0]).toBe(0);
    });

    test("UBS_BD7: max+ bookingId", async () => {
      const result = await bookingRepo.updateBookingStatus(
        2147483648,
        "confirmed"
      );

      expect(result[0]).toBe(0);
    });

    test("UBS_BD8: null bookingId", async () => {
      const result = await bookingRepo.updateBookingStatus(null, "confirmed");

      expect(result[0]).toBe(0);
    });

    test("UBS_BD9: string bookingId", async () => {
      const result = await bookingRepo.updateBookingStatus(
        "invalid",
        "confirmed"
      );

      expect(result[0]).toBe(0);
    });

    test("UBS_BD10: invalid status value", async () => {
      const result = await bookingRepo.updateBookingStatus(
        testBookingId,
        "invalid_status"
      );

      expect(result[0]).toBe(1);

      const updatedBooking = await Booking.findByPk(testBookingId);
      expect(updatedBooking.status).toBe("invalid_status");
    });
  });

  describe("getBookingsByUserId - Boundary Testing", () => {
    let testUserIds = [];

    beforeEach(async () => {
      const users = await User.bulkCreate([
        {
          name: "User 1",
          email: "user1@test.com",
          password: "pass",
          phone: "111",
          role: "user",
        },
        {
          name: "User 2",
          email: "user2@test.com",
          password: "pass",
          phone: "222",
          role: "user",
        },
      ]);
      testUserIds = users.map((u) => u.id);

      await Booking.bulkCreate([
        {
          roomId: testRoom.id,
          userId: testUserIds[0],
          date: "2025-12-15",
          startTime: "09:00:00",
          endTime: "10:00:00",
          status: "confirmed",
        },
        {
          roomId: testRoom.id,
          userId: testUserIds[0],
          date: "2025-12-16",
          startTime: "11:00:00",
          endTime: "12:00:00",
          status: "pending",
        },
        {
          roomId: testRoom.id,
          userId: testUserIds[1],
          date: "2025-12-17",
          startTime: "14:00:00",
          endTime: "15:00:00",
          status: "confirmed",
        },
      ]);
    });

    test("GBU_BD1: min- userId", async () => {
      const result = await bookingRepo.getBookingsByUserId(-1);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test("GBU_BD2: min userId", async () => {
      const result = await bookingRepo.getBookingsByUserId(0);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test("GBU_BD3: min+ userId", async () => {
      const result = await bookingRepo.getBookingsByUserId(1);

      expect(Array.isArray(result)).toBe(true);
    });

    test("GBU_BD4: nom userId ", async () => {
      const result = await bookingRepo.getBookingsByUserId(testUserIds[0]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result.every((b) => b.userId === testUserIds[0])).toBe(true);
    });

    test("GBU_BD5: max- userId", async () => {
      const result = await bookingRepo.getBookingsByUserId(2147483646);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test("GBU_BD6: max userId", async () => {
      const result = await bookingRepo.getBookingsByUserId(2147483647);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test("GBU_BD7: max+ userId", async () => {
      const result = await bookingRepo.getBookingsByUserId(2147483648);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test("GBU_BD8: null userId", async () => {
      const result = await bookingRepo.getBookingsByUserId(null);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test("GBU_BD9: string userId", async () => {
      const result = await bookingRepo.getBookingsByUserId("invalid");

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test("GBU_BD10: existing userId with no bookings", async () => {
      const newUser = await User.create({
        name: "No Bookings User",
        email: "nobookings@test.com",
        password: "pass",
        phone: "999",
        role: "user",
      });

      const result = await bookingRepo.getBookingsByUserId(newUser.id);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("deleteBooking - Boundary Testing", () => {
    let testBookingIds = [];

    beforeEach(async () => {
      const bookings = await Booking.bulkCreate([
        {
          roomId: testRoom.id,
          userId: testUser.id,
          date: "2025-12-15",
          startTime: "09:00:00",
          endTime: "10:00:00",
          status: "confirmed",
        },
        {
          roomId: testRoom.id,
          userId: testUser.id,
          date: "2025-12-16",
          startTime: "11:00:00",
          endTime: "12:00:00",
          status: "pending",
        },
      ]);
      testBookingIds = bookings.map((b) => b.id);
    });

    test("DB_BD1: min- bookingId", async () => {
      const result = await bookingRepo.delete(-1);

      expect(result).toBe(0);
    });

    test("DB_BD2: min bookingId", async () => {
      const result = await bookingRepo.delete(0);

      expect(result).toBe(0);
    });

    test("DB_BD3: min+ bookingId", async () => {
      const result = await bookingRepo.delete(1);

      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThanOrEqual(0);
    });

    test("DB_BD4: nom bookingId ", async () => {
      const bookingIdToDelete = testBookingIds[0];
      const result = await bookingRepo.delete(bookingIdToDelete);

      expect(result).toBe(1);

      const deletedBooking = await Booking.findByPk(bookingIdToDelete);
      expect(deletedBooking).toBeNull();
    });

    test("DB_BD5: max- bookingId", async () => {
      const result = await bookingRepo.delete(2147483646);

      expect(result).toBe(0);
    });

    test("DB_BD6: max bookingId", async () => {
      const result = await bookingRepo.delete(2147483647);

      expect(result).toBe(0);
    });

    test("DB_BD7: max+ bookingId", async () => {
      const result = await bookingRepo.delete(2147483648);

      expect(result).toBe(0);
    });

    test("DB_BD8: null bookingId", async () => {
      const result = await bookingRepo.delete(null);

      expect(result).toBe(0);
    });

    test("DB_BD9: string bookingId", async () => {
      const result = await bookingRepo.delete("invalid");

      expect(result).toBe(0);
    });

    test("DB_BD10: undefined bookingId", async () => {
      const result = await bookingRepo.delete(undefined);

      expect(result).toBe(0);
    });
  });
});
