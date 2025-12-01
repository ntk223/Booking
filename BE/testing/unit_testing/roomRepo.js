import {
  RoomRepository,
  Room,
  District,
  Equipment,
  RoomEquipment,
  Booking,
  User,
  setupTestDatabase,
  seedTestData,
  cleanTestData,
  closeTestDatabase,
} from "../setup/mockDatabase.js";

describe("RoomRepository - Unit Testing", () => {
  let roomRepo;

  beforeAll(async () => {
    await setupTestDatabase();
    roomRepo = new RoomRepository();
  });

  beforeEach(async () => {
    await cleanTestData();
    await seedTestData();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe("createRoom", () => {
    describe("Booundary", () => {
      test("BD1: min capacity", async () => {
        const roomData = {
          name: "Small Room",
          location: "Floor 1",
          capacity: 1,
          price: 10000,
          districtId: 1,
        };

        const result = await roomRepo.createRoom(roomData);

        expect(result.roomCreated).toBeDefined();
        expect(result.roomCreated.capacity).toBe(1);
        expect(result.currentPage).toBe(1);
      });

      test("BD2: max capacity", async () => {
        const roomData = {
          name: "Auditorium",
          location: "Main Building",
          capacity: 1000,
          price: 500000,
          districtId: 1,
        };

        const result = await roomRepo.createRoom(roomData);

        expect(result.roomCreated.capacity).toBe(1000);
        expect(result.currentPage).toBe(1);
      });

      test("BD3: nom capacity", async () => {
        const roomData = {
          name: "Auditorium",
          location: "Main Building",
          capacity: 500,
          price: 500000,
          districtId: 1,
        };

        const result = await roomRepo.createRoom(roomData);

        expect(result.roomCreated.capacity).toBe(500);
        expect(result.currentPage).toBe(1);
      });

      test("BD4: min- capacity", async () => {
        const roomData = {
          name: "Auditorium",
          location: "Main Building",
          capacity: 0,
          price: 500000,
          districtId: 1,
        };

        await expect(roomRepo.createRoom(roomData)).rejects.toThrow();
      });

      test("BD5: min price", async () => {
        const roomData = {
          name: "Free Room",
          location: "Community Center",
          capacity: 20,
          price: 0,
          districtId: 1,
        };

        const result = await roomRepo.createRoom(roomData);

        expect(result.roomCreated.price).toBe(0);
        expect(result.currentPage).toBe(1);
      });

      test("BD6: min+ price", async () => {
        const roomData = {
          name: "Cheap Room",
          location: "Building A",
          capacity: 15,
          price: 1,
          districtId: 1,
        };

        const result = await roomRepo.createRoom(roomData);

        expect(result.roomCreated.price).toBe(1);
        expect(result.currentPage).toBe(1);
      });

      test("BD7: nominal price", async () => {
        const roomData = {
          name: "Standard Room",
          location: "Building B",
          capacity: 30,
          price: 100000,
          districtId: 1,
        };

        const result = await roomRepo.createRoom(roomData);

        expect(parseFloat(result.roomCreated.price)).toBe(100000);
        expect(result.currentPage).toBe(1);
      });

      test("BD8: max price", async () => {
        const roomData = {
          name: "Luxury Suite",
          location: "Top Floor",
          capacity: 50,
          price: 9999999.99,
          districtId: 1,
        };

        const result = await roomRepo.createRoom(roomData);

        expect(parseFloat(result.roomCreated.price)).toBe(9999999.99);
        expect(result.currentPage).toBe(1);
      });

      test("BD9: max+ price", async () => {
        const roomData = {
          name: "Overpriced Room",
          location: "Nowhere",
          capacity: 25,
          price: 10000000,
          districtId: 1,
        };

        await expect(roomRepo.createRoom(roomData)).rejects.toThrow();
      });

      test("BD10: min- price", async () => {
        const roomData = {
          name: "Invalid Price Room",
          location: "Test Location",
          capacity: 20,
          price: -1,
          districtId: 1,
        };

        await expect(roomRepo.createRoom(roomData)).rejects.toThrow();
      });
    });

    describe("String input", () => {
      test("NM1: valid name", async () => {
        const roomData = {
          name: "Conference Room A",
          location: "Building 1, Floor 2",
          capacity: 20,
          price: 100000,
          districtId: 1,
        };

        const result = await roomRepo.createRoom(roomData);

        expect(result.roomCreated.name).toBe("Conference Room A");
        expect(result.currentPage).toBe(1);
      });

      test("NM2: name with special characters", async () => {
        const roomData = {
          name: "Phòng họp A&B #123",
          location: "Tầng 1 - Tòa nhà C",
          capacity: 15,
          price: 75000,
          districtId: 1,
        };

        const result = await roomRepo.createRoom(roomData);

        expect(result.roomCreated.name).toBe("Phòng họp A&B #123");
        expect(result.currentPage).toBe(1);
      });

      test("NM3: Long name ", async () => {
        const longName = "A".repeat(255);
        const roomData = {
          name: longName,
          location: "Test Location",
          capacity: 10,
          price: 50000,
          districtId: 1,
        };

        const result = await roomRepo.createRoom(roomData);

        expect(result.roomCreated.name).toBe(longName);
        expect(result.currentPage).toBe(1);
      });

      test("NM4: empty name", async () => {
        const roomData = {
          name: "",
          location: "Test Location",
          capacity: 10,
          price: 50000,
          districtId: 1,
        };

        await expect(roomRepo.createRoom(roomData)).rejects.toThrow();
      });

      test("NM6: undefined name", async () => {
        const roomData = {
          location: "Test Location",
          capacity: 10,
          price: 50000,
          districtId: 1,
        };

        await expect(roomRepo.createRoom(roomData)).rejects.toThrow();
      });

      test("NM7: name with only spaces", async () => {
        const roomData = {
          name: "   ",
          location: "Test Location",
          capacity: 10,
          price: 50000,
          districtId: 1,
        };

        await expect(roomRepo.createRoom(roomData)).rejects.toThrow();
      });

      test("LOC1: valid", async () => {
        const roomData = {
          name: "Test Room",
          location: "Building A, Floor 3, Room 301",
          capacity: 25,
          price: 120000,
          districtId: 1,
        };

        const result = await roomRepo.createRoom(roomData);

        expect(result.roomCreated.location).toBe(
          "Building A, Floor 3, Room 301"
        );
        expect(result.currentPage).toBe(1);
      });

      test("LOC2: location with special characters", async () => {
        const roomData = {
          name: "Meeting Room",
          location: "Tầng 2 - Tòa nhà chính (Cổng A) 123/45",
          capacity: 15,
          price: 80000,
          districtId: 2,
        };

        const result = await roomRepo.createRoom(roomData);

        expect(result.roomCreated.location).toBe(
          "Tầng 2 - Tòa nhà chính (Cổng A) 123/45"
        );
        expect(result.currentPage).toBe(1);
      });

      test("LOC3: long location", async () => {
        const longLocation = "B".repeat(500);
        const roomData = {
          name: "Test Room",
          location: longLocation,
          capacity: 10,
          price: 60000,
          districtId: 1,
        };

        const result = await roomRepo.createRoom(roomData);

        expect(result.roomCreated.location).toBe(longLocation);
        expect(result.currentPage).toBe(1);
      });

      test("LOC4: empty location ", async () => {
        const roomData = {
          name: "Test Room",
          location: "",
          capacity: 10,
          price: 50000,
          districtId: 1,
        };

        await expect(roomRepo.createRoom(roomData)).rejects.toThrow();
      });

      test("LOC5: undefined location", async () => {
        const roomData = {
          name: "Test Room",
          capacity: 10,
          price: 50000,
          districtId: 1,
        };

        await expect(roomRepo.createRoom(roomData)).rejects.toThrow();
      });

      test("LOC6: location with only spaces", async () => {
        const roomData = {
          name: "Test Room",
          location: "   ",
          capacity: 10,
          price: 50000,
          districtId: 1,
        };

        await expect(roomRepo.createRoom(roomData)).rejects.toThrow();
      });
    });
  });

  describe("getRoomDetails", () => {
    let sampleRoomId;
    let roomWithEquipment;
    let roomWithoutEquipment;

    beforeEach(async () => {
      roomWithEquipment = await Room.create({
        name: "Conference Room A",
        location: "Building 1, Floor 2",
        capacity: 25,
        price: 150000,
        districtId: 1,
        imageUrl: "https://example.com/room1.jpg",
      });

      roomWithoutEquipment = await Room.create({
        name: "Simple Meeting Room",
        location: "Building 2, Floor 1",
        capacity: 10,
        price: 75000,
        districtId: 2,
        imageUrl: null,
      });

      sampleRoomId = roomWithEquipment.id;

      await RoomEquipment.create({
        roomId: roomWithEquipment.id,
        equipmentId: 1,
      });
      await RoomEquipment.create({
        roomId: roomWithEquipment.id,
        equipmentId: 2,
      });
    });

    describe("Boundary - roomId", () => {
      test("GRD_BD1: min- roomId", async () => {
        const result = await roomRepo.getRoomDetails(-1);

        expect(result).rejects.toThrow();
      });

      test("GRD_BD2: min roomId", async () => {
        const result = await roomRepo.getRoomDetails(0);

        expect(result).toBeUndefined();
      });

      test("GRD_BD3: min+ roomId", async () => {
        const result = await roomRepo.getRoomDetails(1);

        expect(result).toBeDefined();
      });

      test("GRD_BD4: nominal roomId", async () => {
        const result = await roomRepo.getRoomDetails(sampleRoomId);

        expect(result).toBeDefined();
        expect(result.id).toBe(sampleRoomId);
        expect(result.name).toBe("Conference Room A");
        expect(result.equipments).toEqual(["Projector", "Whiteboard"]);
      });

      test("GRD_BD5: max- roomId", async () => {
        const result = await roomRepo.getRoomDetails(2147483646);

        expect(result).toBeNull();
      });

      test("GRD_BD6: max roomId", async () => {
        const result = await roomRepo.getRoomDetails(2147483647);

        expect(result).toBeNull();
      });

      test("GRD_BD7: max+ roomId", async () => {
        const result = await roomRepo.getRoomDetails(2147483648);

        expect(result).rejects.toThrow();
      });
    });

    describe("Boundary - pageNumber", () => {
      test("GRD_PG1: min- pageNumber", async () => {
        const result = await roomRepo.getRoomDetails(null, -1);

        expect(result).rejects.toThrow();
      });

      test("GRD_PG2: min pageNumber", async () => {
        const result = await roomRepo.getRoomDetails(null, 0);

        expect(result).toBeUndefined();
      });

      test("GRD_PG3: min+ pageNumber", async () => {
        const result = await roomRepo.getRoomDetails(null, 1);

        expect(result).toBeDefined();
        expect(result.rooms).toBeDefined();
        expect(result.currentPage).toBe(1);
        expect(result.totalPages).toBeGreaterThanOrEqual(0);
      });

      test("GRD_PG4: nominal pageNumber", async () => {
        await Room.bulkCreate([
          {
            name: "Room 3",
            location: "Loc 3",
            capacity: 20,
            price: 100000,
            districtId: 1,
          },
          {
            name: "Room 4",
            location: "Loc 4",
            capacity: 30,
            price: 120000,
            districtId: 2,
          },
        ]);

        const result = await roomRepo.getRoomDetails(null, 2);

        expect(result).toBeDefined();
        expect(result.currentPage).toBe(2);
        expect(result.totalPages).toBeGreaterThanOrEqual(1);
      });

      test("GRD_PG5: max- pageNumber", async () => {
        const result = await roomRepo.getRoomDetails(null, 999);

        expect(result).toBeDefined();
        expect(result.rooms).toEqual([]);
        expect(result.currentPage).toBe(999);
      });

      test("GRD_PG6: max pageNumber", async () => {
        const result = await roomRepo.getRoomDetails(null, 1000);

        expect(result).toBeDefined();
        expect(result.rooms).toEqual([]);
        expect(result.currentPage).toBe(1000);
      });

      test("GRD_PG7: max+ pageNumber", async () => {
        const result = await roomRepo.getRoomDetails(null, 2147483648);

        expect(result).reject.toThrow();
      });
    });

    describe("Edge Cases", () => {
      test("GRD_EDGE1: null roomId, null pageNumber", async () => {
        const result = await roomRepo.getRoomDetails(null, null);

        expect(result).toBeUndefined();
      });

      test("GRD_EDGE2: undefined roomId, undefined pageNumber", async () => {
        const result = await roomRepo.getRoomDetails(undefined, undefined);

        expect(result).toBeUndefined();
      });

      test("GRD_EDGE3: NaN roomId", async () => {
        const result = await roomRepo.getRoomDetails(NaN);

        expect(result).toBeUndefined(); // NaN is falsy
      });
    });

    describe("Valid Cases", () => {
      test("GRD_VALID1: valid roomId with equipment", async () => {
        const result = await roomRepo.getRoomDetails(sampleRoomId);

        expect(result).toBeDefined();
        expect(result.id).toBe(sampleRoomId);
        expect(result.name).toBe("Conference Room A");
        expect(result.location).toBe("Building 1, Floor 2");
        expect(result.capacity).toBe(25);
        expect(result.price).toBe(150000);
        expect(result.district).toBe("District 1");
        expect(result.districtId).toBe(1);
        expect(result.imageUrl).toBe("https://example.com/room1.jpg");
        expect(result.equipments).toEqual(["Projector", "Whiteboard"]);
      });

      test("GRD_VALID2: valid roomId without equipment", async () => {
        const result = await roomRepo.getRoomDetails(roomWithoutEquipment.id);

        expect(result).toBeDefined();
        expect(result.id).toBe(roomWithoutEquipment.id);
        expect(result.name).toBe("Simple Meeting Room");
        expect(result.location).toBe("Building 2, Floor 1");
        expect(result.capacity).toBe(10);
        expect(result.price).toBe(75000);
        expect(result.district).toBe("District 2");
        expect(result.districtId).toBe(2);
        expect(result.imageUrl).toBeNull();
        expect(result.equipments).toEqual([]);
      });

      test("GRD_VALID3: valid pagination", async () => {
        await Room.bulkCreate([
          {
            name: "Room A",
            location: "Location A",
            capacity: 10,
            price: 50000,
            districtId: 1,
          },
          {
            name: "Room B",
            location: "Location B",
            capacity: 20,
            price: 75000,
            districtId: 2,
          },
          {
            name: "Room C",
            location: "Location C",
            capacity: 30,
            price: 100000,
            districtId: 3,
          },
        ]);

        const result = await roomRepo.getRoomDetails(null, 1);

        expect(result).toBeDefined();
        expect(result.rooms).toBeDefined();
        expect(Array.isArray(result.rooms)).toBe(true);
        expect(result.currentPage).toBe(1);
        expect(result.totalPages).toBeGreaterThanOrEqual(1);
        expect(result.rooms.length).toBeGreaterThan(0);

        if (result.rooms.length > 0) {
          const room = result.rooms[0];
          expect(room).toHaveProperty("id");
          expect(room).toHaveProperty("name");
          expect(room).toHaveProperty("location");
          expect(room).toHaveProperty("capacity");
          expect(room).toHaveProperty("price");
          expect(room).toHaveProperty("district");
          expect(room).toHaveProperty("districtId");
          expect(room).toHaveProperty("equipments");
          expect(Array.isArray(room.equipments)).toBe(true);
        }
      });
    });
  });

  describe("deleteRoom - Boundary Testing", () => {
    let testRoomIds = [];

    beforeEach(async () => {
      const rooms = await Room.bulkCreate([
        {
          name: "Delete Room 1",
          location: "Loc 1",
          capacity: 10,
          price: 50000,
          districtId: 1,
        },
        {
          name: "Delete Room 2",
          location: "Loc 2",
          capacity: 20,
          price: 75000,
          districtId: 2,
        },
        {
          name: "Delete Room 3",
          location: "Loc 3",
          capacity: 30,
          price: 100000,
          districtId: 1,
        },
      ]);
      testRoomIds = rooms.map((room) => room.id);
    });

    test("DEL_BD1: min- roomId", async () => {
      const result = await roomRepo.deleteRoom(-1);

      expect(result).rejects.toThrow();
    });

    test("DEL_BD2: min roomId", async () => {
      const result = await roomRepo.deleteRoom(0);

      expect(result.totalPages).toBeDefined();
      expect(result.currentPage).toBeDefined();
    });

    test("DEL_BD3: min+ roomId", async () => {
      const result = await roomRepo.deleteRoom(1);

      expect(result.totalPages).toBeDefined();
      expect(result.currentPage).toBeDefined();
    });

    test("DEL_BD4: nominal roomId", async () => {
      const roomToDelete = testRoomIds[1];
      const result = await roomRepo.deleteRoom(roomToDelete);

      expect(result.totalPages).toBeDefined();
      expect(result.currentPage).toBeDefined();

      const deletedRoom = await Room.findByPk(roomToDelete);
      expect(deletedRoom).toBeNull();
    });

    test("DEL_BD5: max- roomId", async () => {
      const result = await roomRepo.deleteRoom(2147483646);

      expect(result.totalPages).toBeDefined();
      expect(result.currentPage).toBeDefined();
    });

    test("DEL_BD6: max roomId", async () => {
      const result = await roomRepo.deleteRoom(2147483647);

      expect(result.totalPages).toBeDefined();
      expect(result.currentPage).toBeDefined();
    });

    test("DEL_BD7: max+ roomId", async () => {
      const result = await roomRepo.deleteRoom(2147483648);

      expect(result).rejects.toThrow();
    });

    test("DEL_BD8: null roomId", async () => {
      const result = await roomRepo.deleteRoom(null);

      expect(result.totalPages).toBeDefined();
      expect(result.currentPage).toBeDefined();
    });
  });

  describe("updateRoom - Boundary Testing", () => {
    let testRoomId;

    beforeEach(async () => {
      const room = await Room.create({
        name: "Update Test Room",
        location: "Original Location",
        capacity: 20,
        price: 100000,
        districtId: 1,
      });
      testRoomId = room.id;
    });

    test("UPD_BD1: min- roomId", async () => {
      const updateData = { name: "Updated Name" };
      const result = await roomRepo.updateRoom(-1, updateData);

      expect(result).rejects.toThrow();
    });

    test("UPD_BD2: min roomId", async () => {
      const updateData = { name: "Updated Name" };
      const result = await roomRepo.updateRoom(0, updateData);

      expect(result.room).toBeNull();
      expect(result.currentPage).toBeDefined();
    });

    test("UPD_BD3: min+ roomId", async () => {
      const updateData = { name: "Updated Name" };
      const result = await roomRepo.updateRoom(1, updateData);

      expect(result.currentPage).toBeDefined();
    });

    test("UPD_BD4: nominal roomId", async () => {
      const updateData = {
        name: "Successfully Updated Room",
        location: "New Location",
        capacity: 25,
        price: 150000,
      };
      const result = await roomRepo.updateRoom(testRoomId, updateData);

      expect(result.room).toBeDefined();
      expect(result.room.name).toBe("Successfully Updated Room");
      expect(result.room.location).toBe("New Location");
      expect(result.room.capacity).toBe(25);
      expect(result.currentPage).toBeDefined();
    });

    test("UPD_BD5: max- roomId", async () => {
      const updateData = { name: "Updated Name" };
      const result = await roomRepo.updateRoom(2147483646, updateData);

      expect(result.room).toBeNull();
      expect(result.currentPage).toBeDefined();
    });

    test("UPD_BD6: max roomId", async () => {
      const updateData = { name: "Updated Name" };
      const result = await roomRepo.updateRoom(2147483647, updateData);

      expect(result.room).toBeNull();
      expect(result.currentPage).toBeDefined();
    });

    test("UPD_BD7: max+ roomId", async () => {
      const updateData = { name: "Updated Name" };
      const result = await roomRepo.updateRoom(2147483648, updateData);

      expect(result).rejects.toThrow();
    });
  });

  describe("searchRooms - Boundary Testing", () => {
    beforeEach(async () => {
      await User.bulkCreate([
        { id: 1, name: "User 1", email: "user1@test.com" },
        { id: 2, name: "User 2", email: "user2@test.com" },
      ]);

      await Room.bulkCreate([
        {
          id: 1,
          name: "Search Room 1",
          location: "Floor 1",
          capacity: 1,
          price: 1,
          districtId: 1,
        },
        {
          id: 2,
          name: "Search Room 2",
          location: "Floor 2",
          capacity: 50,
          price: 100000,
          districtId: 2,
        },
        {
          id: 3,
          name: "Search Room 3",
          location: "Floor 3",
          capacity: 1000,
          price: 9999999.99,
          districtId: 3,
        },
      ]);

      await Booking.bulkCreate([
        {
          roomId: 1,
          userId: 1,
          date: "2025-12-15",
          startTime: "09:00:00",
          endTime: "10:00:00",
          status: "confirmed",
        },
      ]);
    });

    test("SRCH_BD1: min- capacity", async () => {
      const result = await roomRepo.searchRooms({ capacity: -1 });

      expect(Array.isArray(result)).rejects.toThrow();
    });

    test("SRCH_BD2: min capacity", async () => {
      const result = await roomRepo.searchRooms({ capacity: 0 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
    });

    test("SRCH_BD3: min+ capacity", async () => {
      const result = await roomRepo.searchRooms({ capacity: 1 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result.every((room) => room.capacity >= 1)).toBe(true);
    });

    test("SRCH_BD4: nominal capacity", async () => {
      const result = await roomRepo.searchRooms({ capacity: 50 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result.every((room) => room.capacity >= 50)).toBe(true);
    });

    test("SRCH_BD5: max- capacity", async () => {
      const result = await roomRepo.searchRooms({ capacity: 999 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result.every((room) => room.capacity >= 999)).toBe(true);
    });

    test("SRCH_BD6: max capacity", async () => {
      const result = await roomRepo.searchRooms({ capacity: 1000 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].capacity).toBe(1000);
    });

    test("SRCH_BD7: max+ capacity", async () => {
      const result = await roomRepo.searchRooms({ capacity: 1001 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test("SRCH_VALID: complex criteria", async () => {
      const criteria = {
        capacity: 50,
        districtId: 2,
        searchDate: "2025-12-15",
        startTime: "11:00:00",
        endTime: "12:00:00",
      };

      const result = await roomRepo.searchRooms(criteria);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].capacity).toBeGreaterThanOrEqual(50);
      expect(result[0].district_name).toBe("District 2");
    });
  });
});
