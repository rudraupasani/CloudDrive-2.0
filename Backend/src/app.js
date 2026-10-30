import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import envConfig from './config/env.js';

import registerRoutes from './routes/auth/register.routes.js';
import loginRoutes from './routes/auth/login.routes.js';
import profileRoutes from './routes/user/profile.routes.js';
import fileRoutes from './routes/file/file.routes.js';
import healthRoutes from './routes/health/health.routes.js';

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Base API v1 Routes
app.use('/api/v1', healthRoutes);
app.use('/api/v1', registerRoutes);
app.use('/api/v1', loginRoutes);
app.use('/api/v1', profileRoutes);
app.use('/api/v1', fileRoutes);

export default app;