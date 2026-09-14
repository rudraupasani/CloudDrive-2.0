import dotenv from 'dotenv';
import path from 'path';

// Ensure dotenv is loaded
dotenv.config();

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];

export const validateEnv = () => {
  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error(` Please check your Backend/.env file or refer to Backend/.env.example`);
  } else {
    console.log('✅ Environment configuration loaded cleanly.');
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('⚠️ Upstash Redis credentials missing. Caching feature will operate in fallback mode.');
  }
};

export default {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
  upstashUrl: process.env.UPSTASH_REDIS_REST_URL,
  upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN,
};
