import express from 'express';
import { getHealthStatus } from '../../controllers/health/health.controllers.js';

const router = express.Router();

router.get('/health', getHealthStatus);

export default router;
