import { createContainer, asClass, asValue, asFunction, InjectionMode } from 'awilix';

// Import repositories
import { userRepo } from "../repositories/userRepo.js";
import { roomRepo } from "../repositories/roomRepo.js";
import { bookingRepo } from "../repositories/bookingRepo.js";

// Import configurations
import { rawRedisClient } from "./redis.js";
import sequelize from "./database.js";
import { cacheManager } from "../utils/CacheManager.js";

// Import services
import { UserService } from "../services/userService.js";
import { RoomService } from "../services/roomService.js";
import { BookingService } from "../services/bookingService.js";
import { GCPService } from "../services/GCPService.js";

// Import controllers
import { UserController } from "../controllers/userController.js";
import { RoomController } from "../controllers/roomController.js";
import { BookingController } from "../controllers/bookingController.js";
import { StorageController } from "../controllers/storageController.js";
import { DistrictController } from "../controllers/districtController.js";

/**
 * Create and configure the DI container
 */
export function createDIContainer() {
    const container = createContainer({
        injectionMode: InjectionMode.PROXY
    });

    // Register repositories as singletons (reused across app)
    container.register({
        userRepo: asValue(userRepo),
        roomRepo: asValue(roomRepo),
        bookingRepo: asValue(bookingRepo),
    });

    // Register infrastructure/utilities as singletons
    container.register({
        redisClient: asValue(rawRedisClient),
        sequelize: asValue(sequelize),
        cacheManager: asValue(cacheManager),
    });

    // Register services as singletons with automatic dependency injection
    container.register({
        userService: asClass(UserService).singleton(),
        roomService: asClass(RoomService).singleton(),
        bookingService: asClass(BookingService).singleton(),
        gcpService: asClass(GCPService).singleton(),
    });

    // Register controllers as singletons with automatic dependency injection
    container.register({
        userController: asClass(UserController).singleton(),
        roomController: asClass(RoomController).singleton(),
        bookingController: asClass(BookingController).singleton(),
        storageController: asClass(StorageController).singleton(),
        districtController: asClass(DistrictController).singleton(),
    });

    return container;
}

// Create and export the singleton container instance
export const container = createDIContainer();

/**
 * Helper function to get a service from the container
 * @template T
 * @param {string} name - Service name
 * @returns {T}
 */
export function resolve(name) {
    return container.resolve(name);
}
