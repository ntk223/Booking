import {
  setupDatabase,
  cleanupDatabase,
  User,
  UserRepository,
} from "../setup/mockDatabase.js";

describe("UserRepository - Complete Testing", () => {
  let userRepo;

  beforeAll(async () => {
    await setupDatabase();
    userRepo = new UserRepository();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  beforeEach(async () => {
    await User.destroy({ where: {}, force: true });
  });

  describe("createUser - 10 tests", () => {
    test("CU_01: valid email", async () => {
      const userData = {
        name: "Test User",
        email: "valid@example.com",
        password: "password123",
        phone: "1234567890",
        role: "user",
      };

      const result = await userRepo.createUser(userData);
      expect(result.email).toBe("valid@example.com");
    });

    test("CU_02: duplicate email", async () => {
      const userData1 = {
        name: "First User",
        email: "duplicate@example.com",
        password: "password123",
        phone: "1234567890",
        role: "user",
      };

      const userData2 = {
        name: "Second User",
        email: "duplicate@example.com",
        password: "different123",
        phone: "0987654321",
        role: "admin",
      };

      await userRepo.createUser(userData1);
      await expect(userRepo.createUser(userData2)).rejects.toThrow(
        "Email already in use."
      );
    });

    test("CU_03: null email", async () => {
      const userData = {
        name: "Test User",
        email: null,
        password: "password123",
        phone: "1234567890",
        role: "user",
      };

      await expect(userRepo.createUser(userData)).rejects.toThrow();
    });

    test("CU_04: valid name", async () => {
      const userData = {
        name: "Valid Name",
        email: "test1@example.com",
        password: "password123",
        phone: "1234567890",
        role: "user",
      };

      const result = await userRepo.createUser(userData);
      expect(result.name).toBe("Valid Name");
    });

    test("CU_05: empty name", async () => {
      const userData = {
        name: "",
        email: "test2@example.com",
        password: "password123",
        phone: "1234567890",
        role: "user",
      };

      const result = await userRepo.createUser(userData);
      expect(result.email).toBe("test2@example.com");
    });

    test("CU_06: null name", async () => {
      const userData = {
        name: null,
        email: "test3@example.com",
        password: "password123",
        phone: "1234567890",
        role: "user",
      };

      await expect(userRepo.createUser(userData)).rejects.toThrow();
    });

    test("CU_07: valid password", async () => {
      const userData = {
        name: "Test User",
        email: "test4@example.com",
        password: "validpassword",
        phone: "1234567890",
        role: "user",
      };

      const result = await userRepo.createUser(userData);
      expect(result.email).toBe("test4@example.com");
    });

    test("CU_08: empty password", async () => {
      const userData = {
        name: "Test User",
        email: "test5@example.com",
        password: "",
        phone: "1234567890",
        role: "user",
      };

      const result = await userRepo.createUser(userData);
      expect(result.email).toBe("test5@example.com");
    });

    test("CU_09: null password", async () => {
      const userData = {
        name: "Test User",
        email: "test6@example.com",
        password: null,
        phone: "1234567890",
        role: "user",
      };

      const result = await userRepo.createUser(userData);
      expect(result.email).toBe("test6@example.com");
    });

    test("CU_10: valid phone", async () => {
      const userData = {
        name: "Test User",
        email: "test7@example.com",
        password: "password123",
        phone: "1234567890",
        role: "user",
      };

      const result = await userRepo.createUser(userData);
      expect(result.email).toBe("test7@example.com");
    });
  });

  describe("getAllUsers - 10 tests", () => {
    test("GAU_01: empty database", async () => {
      const result = await userRepo.getAllUsers();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test("GAU_02: single user in database", async () => {
      await User.create({
        name: "Single User",
        email: "single@example.com",
        password: "password123",
        phone: "1234567890",
        role: "user",
      });

      const result = await userRepo.getAllUsers();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].email).toBe("single@example.com");
    });

    test("GAU_03: two users in database", async () => {
      await User.bulkCreate([
        {
          name: "User One",
          email: "user1@example.com",
          password: "password123",
          phone: "1234567890",
          role: "user",
        },
        {
          name: "User Two",
          email: "user2@example.com",
          password: "password456",
          phone: "0987654321",
          role: "admin",
        },
      ]);

      const result = await userRepo.getAllUsers();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    test("GAU_04: five users in database", async () => {
      const users = [];
      for (let i = 1; i <= 5; i++) {
        users.push({
          name: `User ${i}`,
          email: `user${i}@example.com`,
          password: `password${i}`,
          phone: `123456789${i}`,
          role: "user",
        });
      }
      await User.bulkCreate(users);

      const result = await userRepo.getAllUsers();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
    });

    test("GAU_05: ten users in database", async () => {
      const users = [];
      for (let i = 1; i <= 10; i++) {
        users.push({
          name: `User ${i}`,
          email: `user${i}@example.com`,
          password: `password${i}`,
          phone: `12345678${i.toString().padStart(2, "0")}`,
          role: i % 2 === 0 ? "admin" : "user",
        });
      }
      await User.bulkCreate(users);

      const result = await userRepo.getAllUsers();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(10);
    });

    test("GAU_06: users with different roles", async () => {
      await User.bulkCreate([
        {
          name: "Admin User",
          email: "admin@example.com",
          password: "adminpass",
          phone: "1111111111",
          role: "admin",
        },
        {
          name: "Regular User",
          email: "user@example.com",
          password: "userpass",
          phone: "2222222222",
          role: "user",
        },
      ]);

      const result = await userRepo.getAllUsers();

      expect(result.length).toBe(2);
      expect(result[0]).toBeDefined();
      expect(result[1]).toBeDefined();
      expect(result[0].email).toBeDefined();
      expect(result[1].email).toBeDefined();
    });

    test("GAU_07: users with same name different email", async () => {
      await User.bulkCreate([
        {
          name: "John Doe",
          email: "john1@example.com",
          password: "password1",
          phone: "1111111111",
          role: "user",
        },
        {
          name: "John Doe",
          email: "john2@example.com",
          password: "password2",
          phone: "2222222222",
          role: "user",
        },
      ]);

      const result = await userRepo.getAllUsers();

      expect(result.length).toBe(2);
      expect(result[0].name).toBe("John Doe");
      expect(result[1].name).toBe("John Doe");
      expect(result[0].email).not.toBe(result[1].email);
    });

    test("GAU_08: large dataset (100 users)", async () => {
      const users = [];
      for (let i = 1; i <= 100; i++) {
        users.push({
          name: `User ${i}`,
          email: `user${i}@example.com`,
          password: `password${i}`,
          phone: `1${i.toString().padStart(9, "0")}`,
          role: i % 3 === 0 ? "admin" : "user",
        });
      }
      await User.bulkCreate(users);

      const result = await userRepo.getAllUsers();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(100);
    });

    test("GAU_09: users with special characters in name", async () => {
      await User.create({
        name: "José María Ñoño",
        email: "jose@example.com",
        password: "password123",
        phone: "1234567890",
        role: "user",
      });

      const result = await userRepo.getAllUsers();

      expect(result.length).toBe(1);
      expect(result[0].name).toBe("José María Ñoño");
    });

    test("GAU_10: verify order consistency", async () => {
      await User.bulkCreate([
        {
          name: "User A",
          email: "a@example.com",
          password: "pass",
          phone: "1111111111",
          role: "user",
        },
        {
          name: "User B",
          email: "b@example.com",
          password: "pass",
          phone: "2222222222",
          role: "user",
        },
        {
          name: "User C",
          email: "c@example.com",
          password: "pass",
          phone: "3333333333",
          role: "user",
        },
      ]);

      const result1 = await userRepo.getAllUsers();
      const result2 = await userRepo.getAllUsers();

      expect(result1.length).toBe(result2.length);
      expect(result1[0].id).toBe(result2[0].id);
    });
  });

  describe("deleteUser ", () => {
    let testUserIds = [];

    beforeEach(async () => {
      const users = await User.bulkCreate([
        {
          name: "Delete User 1",
          email: "delete1@example.com",
          password: "pass",
          phone: "111",
          role: "user",
        },
        {
          name: "Delete User 2",
          email: "delete2@example.com",
          password: "pass",
          phone: "222",
          role: "user",
        },
        {
          name: "Delete User 3",
          email: "delete3@example.com",
          password: "pass",
          phone: "333",
          role: "admin",
        },
      ]);
      testUserIds = users.map((user) => user.id);
    });

    test("DU_01: min- userId ", async () => {
      const result = await userRepo.deleteUser(-1);
      expect(result).toBe(0);
    });

    test("DU_02: min userId", async () => {
      const result = await userRepo.deleteUser(0);
      expect(result).toBe(0);
    });

    test("DU_03: min+ userId", async () => {
      const result = await userRepo.deleteUser(1);
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThanOrEqual(0);
    });

    test("DU_04: nominal userId", async () => {
      const userIdToDelete = testUserIds[1];
      const result = await userRepo.deleteUser(userIdToDelete);
      expect(result).toBe(1);

      const deletedUser = await User.findByPk(userIdToDelete);
      expect(deletedUser).toBeNull();
    });

    test("DU_05: max- userId ", async () => {
      const result = await userRepo.deleteUser(2147483646);
      expect(result).toBe(0);
    });

    test("DU_06: max userId", async () => {
      const result = await userRepo.deleteUser(2147483647);
      expect(result).toBe(0);
    });

    test("DU_07: max+ userId (2147483648)", async () => {
      const result = await userRepo.deleteUser(2147483648);
      expect(result).toBe(0);
    });

    test("DU_08: string userId", async () => {
      const result = await userRepo.deleteUser("invalid_id");
      expect(result).toBe(0);
    });

    test("DU_09: null userId", async () => {
      const result = await userRepo.deleteUser(null);
      expect(result).toBe(0);
    });

    test("DU_10: undefined userId", async () => {
      const result = await userRepo.deleteUser(undefined);
      expect(result).toBe(0);
    });
  });

  describe("updateUser", () => {
    let testUserId;

    beforeEach(async () => {
      const user = await User.create({
        name: "Update Test User",
        email: "updatetest@example.com",
        password: "originalpass",
        phone: "1234567890",
        role: "user",
      });
      testUserId = user.id;
    });

    test("UU_01: min- userId ", async () => {
      const updateData = { name: "Updated Name" };
      const result = await userRepo.updateUser(-1, updateData);
      expect(result).toBe(0);
    });

    test("UU_02: min userId ", async () => {
      const updateData = { name: "Updated Name" };
      const result = await userRepo.updateUser(0, updateData);
      expect(result).toBe(0);
    });

    test("UU_03: min+ userId ", async () => {
      const updateData = { name: "Updated Name" };
      const result = await userRepo.updateUser(1, updateData);
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThanOrEqual(0);
    });

    test("UU_04: nominal userId", async () => {
      const updateData = {
        name: "Successfully Updated User",
        phone: "9876543210",
        role: "admin",
      };
      const result = await userRepo.updateUser(testUserId, updateData);
      expect(result).toBe(1);

      const updatedUser = await User.findByPk(testUserId);
      expect(updatedUser.name).toBe("Successfully Updated User");
    });

    test("UU_05: max- userId", async () => {
      const updateData = { name: "Updated Name" };
      const result = await userRepo.updateUser(2147483646, updateData);
      expect(result).toBe(0);
    });

    test("UU_06: max userId ", async () => {
      const updateData = { name: "Updated Name" };
      const result = await userRepo.updateUser(2147483647, updateData);
      expect(result).toBe(0);
    });

    test("UU_07: max+ userId ", async () => {
      const updateData = { name: "Updated Name" };
      const result = await userRepo.updateUser(2147483648, updateData);
      expect(result).toBe(0);
    });

    test("UU_08: valid name update", async () => {
      const updateData = { name: "Valid Updated Name" };
      const result = await userRepo.updateUser(testUserId, updateData);
      expect(result).toBe(1);

      const updatedUser = await User.findByPk(testUserId);
      expect(updatedUser.name).toBe("Valid Updated Name");
    });

    test("UU_09: empty name update", async () => {
      const updateData = { name: "" };
      const result = await userRepo.updateUser(testUserId, updateData);
      expect(result).toBe(1);

      const updatedUser = await User.findByPk(testUserId);
      expect(updatedUser.name).toBe("");
    });

    test("UU_10: null name update", async () => {
      const updateData = { name: null };
      await expect(
        userRepo.updateUser(testUserId, updateData)
      ).rejects.toThrow();
    });
  });

  describe("login ", () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        name: "Login Test User",
        email: "logintest@example.com",
        password: "correctpassword",
        phone: "1234567890",
        role: "user",
      });
    });

    test("L_01: valid email and password", async () => {
      const result = await userRepo.login(
        "logintest@example.com",
        "correctpassword"
      );
      expect(result).toBeDefined();
    });

    test("L_02: empty email", async () => {
      await expect(userRepo.login("", "correctpassword")).rejects.toThrow(
        "Email and password are required."
      );
    });

    test("L_03: null email", async () => {
      await expect(userRepo.login(null, "correctpassword")).rejects.toThrow(
        "Email and password are required."
      );
    });

    test("L_04: valid password", async () => {
      const result = await userRepo.login(
        "logintest@example.com",
        "correctpassword"
      );
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
    });

    test("L_05: empty password", async () => {
      await expect(userRepo.login("logintest@example.com", "")).rejects.toThrow(
        "Email and password are required."
      );
    });

    test("L_06: null password", async () => {
      await expect(
        userRepo.login("logintest@example.com", null)
      ).rejects.toThrow("Email and password are required.");
    });

    test("L_07: non-existent email", async () => {
      await expect(
        userRepo.login("nonexistent@example.com", "anypassword")
      ).rejects.toThrow("User not found.");
    });

    test("L_08: wrong password", async () => {
      await expect(
        userRepo.login("logintest@example.com", "wrongpassword")
      ).rejects.toThrow("Invalid password.");
    });

    test("L_09: both email and password empty", async () => {
      await expect(userRepo.login("", "")).rejects.toThrow(
        "Email and password are required."
      );
    });

    test("L_10: undefined email and password", async () => {
      await expect(userRepo.login(undefined, undefined)).rejects.toThrow(
        "Email and password are required."
      );
    });
  });
});
