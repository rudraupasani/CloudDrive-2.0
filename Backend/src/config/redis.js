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
  },
  sadd: async (key, ...members) => {
    if (!redisClient) return 0;
    try {
      return await redisClient.sadd(key, ...members);
    } catch (e) {
      console.warn(`Redis SADD failed for key ${key}:`, e.message);
      return 0;
    }
  },
  srem: async (key, ...members) => {
    if (!redisClient) return 0;
    try {
      return await redisClient.srem(key, ...members);
    } catch (e) {
      console.warn(`Redis SREM failed for key ${key}:`, e.message);
      return 0;
    }
  },
  smembers: async (key) => {
    if (!redisClient) return [];
    try {
      const res = await redisClient.smembers(key);
      return Array.isArray(res) ? res : [];
    } catch (e) {
      console.warn(`Redis SMEMBERS failed for key ${key}:`, e.message);
      return [];
    }
  },
  sismember: async (key, member) => {
    if (!redisClient) return 0;
    try {
      return await redisClient.sismember(key, member);
    } catch (e) {
      console.warn(`Redis SISMEMBER failed for key ${key}:`, e.message);
      return 0;
    }
  }
};

export { redisClient as redis };