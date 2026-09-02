import redis from "redis";
import config from "../config";

export const redisClient = redis.createClient({
  url: config.redis_url,
});

redisClient.on("error", (error) => {
  console.error("Redis Client Error:", error);
});

redisClient.on("connect", () => {
  console.log("Redis connecting...");
});

redisClient.on("ready", () => {
  console.log("Redis ready");
});

redisClient.on("reconnecting", () => {
  console.log("Redis reconnecting...");
});

redisClient.on("end", () => {
  console.log("Redis connection closed");
});

export const ensureConnected = async (): Promise<void> => {
  if (redisClient.isReady) {
    return;
  }

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

export const setCache = async <T>(
  key: string,
  value: T,
  expirationInSeconds: number,
): Promise<void> => {
  await ensureConnected();

  await redisClient.set(key, JSON.stringify(value), {
    EX: expirationInSeconds,
  });
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  await ensureConnected();

  const data = await redisClient.get(key);

  if (!data) {
    return null;
  }

  return JSON.parse(data) as T;
};

export const deleteCache = async (key: string): Promise<void> => {
  await ensureConnected();

  await redisClient.del(key);
};

export const setCacheKeepTtl = async <T>(
  key: string,
  value: T,
): Promise<void> => {
  await ensureConnected();

  await redisClient.set(key, JSON.stringify(value), {
    KEEPTTL: true,
  });
};
