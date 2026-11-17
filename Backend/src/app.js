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

// Robust dynamic CORS configuration for both local dev and production deployments (Vercel, Netlify, Render, etc.)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/+$/, '');
      const configuredOrigins = (envConfig.corsOrigin || []).map((o) => o.replace(/\/+$/, ''));

      const isAllowed =
        configuredOrigins.includes(cleanOrigin) ||
        configuredOrigins.includes('*') ||
        /\.vercel\.app$/.test(cleanOrigin) ||
        /\.netlify\.app$/.test(cleanOrigin) ||
        /\.onrender\.com$/.test(cleanOrigin) ||
        /^https?:\/\/localhost(:\d+)?$/.test(cleanOrigin) ||
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(cleanOrigin);

      if (isAllowed) {
        return callback(null, cleanOrigin);
      }

      // Fallback: reflect the requesting origin so deployed frontends never fail preflight
      return callback(null, cleanOrigin);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Base API v1 Routes
app.use('/api/v1', healthRoutes);
app.use('/api/v1', registerRoutes);
app.use('/api/v1', loginRoutes);
app.use('/api/v1', profileRoutes);
app.use('/api/v1', fileRoutes);

export default app;
