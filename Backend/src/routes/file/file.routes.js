import express from 'express';
import { UploadFile, GetFiles, DeleteFile } from '../../controllers/file/file.controllers.js';
import authMiddleware from '../../middleware/auth/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/files', UploadFile);
router.get('/files', GetFiles);
router.delete('/files/:id', DeleteFile);

export default router;
