import mongoose from 'mongoose';
import envConfig from '../../config/env.js';

export const getHealthStatus = async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };

  const healthData = {
    status: dbState === 1 ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    environment: envConfig.nodeEnv,
    uptimeSeconds: Math.floor(process.uptime()),
    services: {
      database: {
        status: dbStatusMap[dbState] || 'Unknown',
        connected: dbState === 1,
      },
      cache: {
        configured: Boolean(envConfig.upstashUrl && envConfig.upstashToken),
      },
    },
  };

  const statusCode = dbState === 1 ? 200 : 503;
  return res.status(statusCode).json(healthData);
};
