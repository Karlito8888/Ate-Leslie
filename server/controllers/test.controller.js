import { HTTP_STATUS } from '../utils/constants/index.js';
import { testService } from '../services/test.service.js';
import asyncHandler from '../utils/helpers/asyncHandler.js';

export const testController = {
  createTest: asyncHandler(async (req, res) => {
    const test = await testService.createTest();
    res.status(HTTP_STATUS.CREATED).json(test);
  })
};
