import { Redis } from "@upstash/redis";
import envConfig from "./env.js";

let redisClient = null;

if (envConfig.upstashUrl && envConfig.upstashToken) {
  try {
    redisClient = new Redis({
      url: envConfig.upstashUrl,
      token: envConfig.upstashToken,
    });
  } catch (err) {
    console.error("⚠️ Redis Client Initialization Error:", err.message);
  }
}

// Wrapper to prevent server crashes if redis is unconfigured or fails
export const safeRedis = {
  get: async (key) => {
    if (!redisClient) return null;
    try {
      return await redisClient.get(key);
    } catch (e) {
      console.warn(`Redis GET failed for key ${key}:`, e.message);
      return null;
    }
  },
  set: async (key, val, opts) => {
    if (!redisClient) return null;
    try {
      return await redisClient.set(key, val, opts);
    } catch (e) {
      console.warn(`Redis SET failed for key ${key}:`, e.message);
      return null;
    }
  },
  del: async (key) => {
    if (!redisClient) return null;
    try {
      return await redisClient.del(key);
    } catch (e) {
      console.warn(`Redis DEL failed for key ${key}:`, e.message);
      return null;
    }
  }
};

export { redisClient as redis };