import express from 'express';
import { UploadFile, GetFiles, DeleteFile, ToggleFavorite, GenerateShareLink, GetSharedFile } from '../../controllers/file/file.controllers.js';
import authMiddleware from '../../middleware/auth/auth.middleware.js';

const router = express.Router();

// Public route for viewing shared files
router.get('/files/shared/:shareToken', GetSharedFile);

// Protected routes requiring authentication
router.post('/files', authMiddleware, UploadFile);
router.get('/files', authMiddleware, GetFiles);
router.delete('/files/:id', authMiddleware, DeleteFile);
router.patch('/files/:id/favorite', authMiddleware, ToggleFavorite);
router.post('/files/:id/share', authMiddleware, GenerateShareLink);

export default router;
