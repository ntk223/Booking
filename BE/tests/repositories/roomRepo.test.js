import { jest } from '@jest/globals';

// Define mocks before imports
jest.unstable_mockModule('../../config/database.js', () => ({
    __esModule: true,
    default: {
        define: jest.fn(() => ({})),
        authenticate: jest.fn(),
        literal: jest.fn((str) => str),
        escape: jest.fn((str) => `'${str}'`),
    }
}));

const mockRoom = {
    findAll: jest.fn(),
    count: jest.fn(),
    findByPk: jest.fn(),
};

jest.unstable_mockModule('../../models/Model.js', () => ({
    __esModule: true,
    Room: mockRoom,
    District: { name: 'District' },
    Equipment: { name: 'Equipment' },
    Booking: { name: 'Booking' },
    sequelize: {
        literal: jest.fn((str) => str),
        escape: jest.fn((str) => `'${str}'`),
    }
}));

// Dynamic imports
const { RoomRepository } = await import('../../repositories/roomRepo.js');
const { Room, Booking } = await import('../../models/Model.js');
const { Op } = await import('sequelize');

describe('RoomRepository', () => {
    let roomRepo;

    beforeEach(() => {
        roomRepo = new RoomRepository();
        jest.clearAllMocks();
    });

    describe('searchRooms', () => {
        it('should use Sequelize operators instead of raw SQL for availability check', async () => {
            const criteria = {
                searchDate: '2023-10-27',
                startTime: '10:00',
                endTime: '12:00',
            };

            mockRoom.findAll.mockResolvedValue([]);

            await roomRepo.searchRooms(criteria);

            expect(mockRoom.findAll).toHaveBeenCalled();
            const callArgs = mockRoom.findAll.mock.calls[0][0];

            expect(callArgs.include).toBeDefined();

            const bookingInclude = callArgs.include.find(inc => inc.model === Booking || inc.as === 'bookings');

            const hasBookingInclude = callArgs.include.some(inc =>
                inc.as === 'bookings' &&
                inc.required === false &&
                inc.where
            );

            expect(hasBookingInclude).toBe(true);
            expect(callArgs.where['$bookings.id$']).toBe(null);
        });
    });
});
