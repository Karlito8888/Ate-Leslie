import Test from '../models/test.model.js';

export const testService = {
  createTest: async (name = 'Test Initial') => {
    const test = new Test({ name });
    return await test.save();
  }
};
