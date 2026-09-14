import dotenv from 'dotenv';
dotenv.config();

import envConfig, { validateEnv } from './src/config/env.js';
import app from './src/app.js';
import connectDB from './src/config/db.js';

// Validate environment variables on startup
validateEnv();

// Connect to MongoDB Database
connectDB();

const PORT = envConfig.port;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT} [${envConfig.nodeEnv}]`);
});