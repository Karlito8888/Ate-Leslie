import mongoose from 'mongoose';
import { Contact } from '../../models/index.js';
import * as dbHandler from '../helpers/db.js';

describe('Contact Model Test', () => {
  // Connect to a test database before running any tests
  beforeAll(async () => {
    await dbHandler.connect();
  });

  // Clear all test data after every test
  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  // Remove and close the db and server
  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  // Test case: Successfully create a contact message
  it('create & save contact successfully', async () => {
    const validContact = {
      type: 'information',
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Test message'
    };
    const savedContact = await Contact.create(validContact);
    
    // Object Id should be defined when successfully saved to MongoDB
    expect(savedContact._id).toBeDefined();
    expect(savedContact.name).toBe(validContact.name);
    expect(savedContact.email).toBe(validContact.email);
    expect(savedContact.type).toBe(validContact.type);
    expect(savedContact.status).toBe('pending'); // Default status
  });

  // Test case: Fail to create contact without required fields
  it('fail to create contact without required field', async () => {
    const contactWithoutRequiredField = new Contact({ name: 'John Doe' });
    let err;
    
    try {
      await contactWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });

  // Test case: Create contact with valid phone number
  it('create contact with valid phone number', async () => {
    const contactWithPhone = {
      type: 'callback',
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Call me back',
      phoneNumber: '+33612345678'
    };
    
    const savedContact = await Contact.create(contactWithPhone);
    expect(savedContact.phoneNumber).toBe(contactWithPhone.phoneNumber);
  });

  // Test case: Fail with invalid phone number
  it('fail with invalid phone number', async () => {
    const contactWithInvalidPhone = {
      type: 'callback',
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Call me back',
      phoneNumber: '123' // Invalid format
    };
    
    let err;
    try {
      await Contact.create(contactWithInvalidPhone);
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.phoneNumber).toBeDefined();
  });

  // Test case: Create review with valid rating
  it('create review with valid rating', async () => {
    const review = {
      type: 'review',
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Great service!',
      rating: 5
    };
    
    const savedReview = await Contact.create(review);
    expect(savedReview.rating).toBe(review.rating);
  });

  // Test case: Fail review with invalid rating
  it('fail review with invalid rating', async () => {
    const reviewWithInvalidRating = {
      type: 'review',
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Great service!',
      rating: 6 // Invalid rating > 5
    };
    
    let err;
    try {
      await Contact.create(reviewWithInvalidRating);
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.rating).toBeDefined();
  });
});
