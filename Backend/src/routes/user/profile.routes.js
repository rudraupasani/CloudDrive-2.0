import express from 'express';
import { getUserProfile } from '../../controllers/user/profile.controllers.js';
import authMiddleware from '../../middleware/auth/auth.middleware.js';
import UpdateProfile from '../../controllers/user/profileUpdate.controllers.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/profile', getUserProfile);
router.put('/profile', UpdateProfile);

export default router;
