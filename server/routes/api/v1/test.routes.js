import express from 'express';
import { testController } from '../../../controllers/test.controller.js';

const router = express.Router();
router.post('/', testController.createTest);

export default router;
