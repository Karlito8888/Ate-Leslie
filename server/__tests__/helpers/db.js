import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;

// Connect to the in-memory database
export const connect = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
};

// Clear all test data after every test
export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
};

// Remove and close the db and server
export const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
};

// Create a test user with admin role
export const createTestAdmin = async (User) => {
  return await User.create({
    username: 'testadmin',
    email: 'admin@test.com',
    password: 'Password123!',
    role: 'admin'
  });
};

// Create a test user with user role
export const createTestUser = async (User) => {
  return await User.create({
    username: 'testuser',
    email: 'user@test.com',
    password: 'Password123!',
    role: 'user'
  });
};

// Create a test contact
export const createTestContact = async (Contact, contactData = {}) => {
  const defaultContact = {
    type: 'information',
    name: 'Test Contact',
    email: 'contact@test.com',
    message: 'Test message'
  };
  
  return await Contact.create({ ...defaultContact, ...contactData });
};
