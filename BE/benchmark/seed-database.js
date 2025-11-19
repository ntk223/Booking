/**
 * Database Seed Script with Faker
 * 
 * Generates realistic test data for performance testing
 */

import { faker } from '@faker-js/faker';
import sequelize from '../config/database.js';
import { User, Room, District, Equipment, Booking, RoomEquipment } from '../models/Model.js';

const NUM_USERS = 100;
const NUM_DISTRICTS = 10;
const NUM_ROOMS = 50;
const NUM_EQUIPMENTS = 15;
const NUM_BOOKINGS = 500;

async function clearDatabase() {
  console.log('[INFO] Clearing existing data...\n');
  
  await Booking.destroy({ where: {}, force: true });
  await RoomEquipment.destroy({ where: {}, force: true });
  await Room.destroy({ where: {}, force: true });
  await Equipment.destroy({ where: {}, force: true });
  await District.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });
  
  console.log('[INFO] Database cleared\n');
}

async function seedDistricts() {
  console.log(`[INFO] Seeding ${NUM_DISTRICTS} districts...`);
  
  const districts = [];
  const districtNames = [
    'Downtown', 'Midtown', 'Uptown', 'East Side', 'West Side',
    'North Quarter', 'South Bay', 'Central Plaza', 'Harbor District', 'Tech Park'
  ];
  
  for (let i = 0; i < NUM_DISTRICTS; i++) {
    districts.push({
      name: districtNames[i] || faker.location.city()
    });
  }
  
  const created = await District.bulkCreate(districts);
  console.log(`[SUCCESS] Created ${created.length} districts\n`);
  return created;
}

async function seedEquipment() {
  console.log(`[INFO] Seeding ${NUM_EQUIPMENTS} equipment types...`);
  
  const equipmentTypes = [
    'Projector', 'Whiteboard', 'TV Screen', 'Video Conference System',
    'Sound System', 'Microphone', 'Laptop', 'Printer',
    'Air Conditioning', 'WiFi', 'Phone', 'Coffee Machine',
    'Flipchart', 'Podium', 'Smart Board'
  ];
  
  const equipment = equipmentTypes.map(name => ({
    name
  }));
  
  const created = await Equipment.bulkCreate(equipment);
  console.log(`[SUCCESS] Created ${created.length} equipment types\n`);
  return created;
}

async function seedUsers() {
  console.log(`[INFO] Seeding ${NUM_USERS} users...`);
  
  const users = [];
  const roles = ['user', 'admin'];
  
  for (let i = 0; i < NUM_USERS; i++) {
    users.push({
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      password: faker.internet.password(),
      phone: faker.phone.number(),
      role: i < 5 ? 'admin' : 'user' // First 5 are admins
    });
  }
  
  const created = await User.bulkCreate(users);
  console.log(`[SUCCESS] Created ${created.length} users\n`);
  return created;
}

async function seedRooms(districts, equipments) {
  console.log(`[INFO] Seeding ${NUM_ROOMS} rooms...`);
  
  const rooms = [];
  const roomTypes = ['Conference', 'Meeting', 'Board', 'Training', 'Event', 'Workshop'];
  
  for (let i = 0; i < NUM_ROOMS; i++) {
    const roomType = faker.helpers.arrayElement(roomTypes);
    rooms.push({
      name: `${roomType} Room ${i + 1}`,
      location: `${faker.location.street()}, Floor ${faker.number.int({ min: 1, max: 20 })}`,
      capacity: faker.number.int({ min: 4, max: 100 }),
      status: faker.helpers.arrayElement(['available', 'available', 'available', 'unavailable']), // 75% available
      districtId: faker.helpers.arrayElement(districts).id,
      price: faker.number.int({ min: 50, max: 500 }),
      imageUrl: faker.image.urlLoremFlickr({ category: 'office,room' })
    });
  }
  
  const created = await Room.bulkCreate(rooms);
  
  // Assign random equipment to rooms
  console.log('[INFO] Assigning equipment to rooms...');
  const roomEquipments = [];
  for (const room of created) {
    const numEquipment = faker.number.int({ min: 2, max: 8 });
    const selectedEquipment = faker.helpers.arrayElements(equipments, numEquipment);
    
    for (const equip of selectedEquipment) {
      roomEquipments.push({
        roomId: room.id,
        equipmentId: equip.id
      });
    }
  }
  
  await RoomEquipment.bulkCreate(roomEquipments, { 
    ignoreDuplicates: true,
    validate: false 
  });
  console.log(`[SUCCESS] Created ${created.length} rooms with equipment\n`);
  return created;
}

async function seedBookings(users, rooms) {
  console.log(`[INFO] Seeding ${NUM_BOOKINGS} bookings...`);
  
  const bookings = [];
  const statuses = ['pending', 'confirmed', 'confirmed', 'confirmed', 'cancelled']; // Mostly confirmed
  const purposes = [
    'Team Meeting', 'Client Presentation', 'Training Session', 'Workshop',
    'Interview', 'Planning Meeting', 'Review Session', 'Brainstorming',
    'Conference Call', 'Strategy Discussion'
  ];
  
  for (let i = 0; i < NUM_BOOKINGS; i++) {
    const startHour = faker.number.int({ min: 8, max: 17 }); // 8 AM to 5 PM
    const duration = faker.helpers.arrayElement([1, 2, 3, 4]); // 1-4 hours
    
    bookings.push({
      userId: faker.helpers.arrayElement(users).id,
      roomId: faker.helpers.arrayElement(rooms).id,
      startTime: `${String(startHour).padStart(2, '0')}:00`,
      endTime: `${String(startHour + duration).padStart(2, '0')}:00`,
      date: faker.date.between({ 
        from: new Date('2025-01-01'), 
        to: new Date('2025-12-31') 
      }),
      purpose: faker.helpers.arrayElement(purposes),
      status: faker.helpers.arrayElement(statuses)
    });
  }
  
  try {
    const created = await Booking.bulkCreate(bookings, {
      validate: true,
      individualHooks: false
    });
    console.log(`[SUCCESS] Created ${created.length} bookings\n`);
    return created;
  } catch (error) {
    console.error('[WARNING] Some bookings had conflicts, continuing...\n');
    return [];
  }
}

async function seed() {
  console.log('\n===============================================');
  console.log('     DATABASE SEEDING WITH FAKER DATA         ');
  console.log('===============================================\n');
  
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('[INFO] Connected to database\n');
    
    // Clear existing data
    await clearDatabase();
    
    // Seed data in order (respecting foreign keys)
    const districts = await seedDistricts();
    const equipments = await seedEquipment();
    const users = await seedUsers();
    const rooms = await seedRooms(districts, equipments);
    const bookings = await seedBookings(users, rooms);
    
    console.log('===============================================');
    console.log('           SEEDING COMPLETED                   ');
    console.log('===============================================\n');
    console.log('[SUMMARY]');
    console.log(`   Districts: ${districts.length}`);
    console.log(`   Equipment: ${equipments.length}`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Rooms: ${rooms.length}`);
    console.log(`   Bookings: ${bookings.length}`);
    console.log('\n[INFO] Database is now ready for realistic testing!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('[ERROR] Seeding failed:', error.message);
    process.exit(1);
  }
}

seed();
