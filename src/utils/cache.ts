import { config } from "../config.js";
import { stringify, parse } from "flatted";
import logger from "./logger.js";
import NodeCache from "node-cache";
import Redis from "ioredis";

interface CacheData {
  updateTime: string;
  data: unknown;
}

export const DEFAULT_CACHE_TTL = 3600;
export const MAX_CACHE_TTL = 60 * 60 * 24;

export const normalizeCacheTtl = (ttl: number = config.CACHE_TTL): number => {
  const fallbackTtl =
    Number.isFinite(config.CACHE_TTL) && config.CACHE_TTL > 0
      ? config.CACHE_TTL
      : DEFAULT_CACHE_TTL;
  const safeTtl = Number.isFinite(ttl) && ttl > 0 ? ttl : fallbackTtl;
  return Math.min(Math.floor(safeTtl), MAX_CACHE_TTL);
};

type RedisCacheHitDecision =
  | {
      action: "hit";
      repairTtl?: number;
    }
  | {
      action: "miss";
    };

export const resolveRedisCacheHit = (
  cachedData: CacheData,
  redisTtl: number,
  fallbackTtl: number = config.CACHE_TTL,
  nowMs: number = Date.now(),
): RedisCacheHitDecision => {
  if (redisTtl !== -1) return { action: "hit" };
  const normalizedFallbackTtl = normalizeCacheTtl(fallbackTtl);

  const updateTimeMs = Date.parse(cachedData.updateTime);
  if (!Number.isFinite(updateTimeMs)) return { action: "miss" };

  const ageSeconds = Math.floor((nowMs - updateTimeMs) / 1000);
  const remainingTtl = normalizedFallbackTtl - ageSeconds;

  if (remainingTtl <= 0) return { action: "miss" };

  return { action: "hit", repairTtl: remainingTtl };
};

// init NodeCache
const cache = new NodeCache({
  // 缓存过期时间（ 秒 ）
  stdTTL: normalizeCacheTtl(),
  // 定期检查过期缓存（ 秒 ）
  checkperiod: 600,
  // 克隆变量
  useClones: false,
  // 最大键值对
  maxKeys: 100,
});

// init Redis client
const redis = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
  db: config.REDIS_DB,
  maxRetriesPerRequest: 5,
  // 重试策略：最小延迟 50ms，最大延迟 2s
  retryStrategy: (times) => Math.min(times * 50, 2000),
  // 仅在第一次建立连接
  lazyConnect: true,
});

// Redis 是否可用
let isRedisAvailable: boolean = false;
let isRedisTried: boolean = false;

// Redis 连接状态
const ensureRedisConnection = async () => {
  if (isRedisTried) return;
  try {
    if (redis.status !== "ready" && redis.status !== "connecting") await redis.connect();
    isRedisAvailable = true;
    isRedisTried = true;
    logger.info("📦 [Redis] connected successfully.");
  } catch (error) {
    isRedisAvailable = false;
    isRedisTried = true;
    logger.error(
      `📦 [Redis] connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

// Redis 事件监听
redis.on("error", (err) => {
  if (!isRedisTried) {
    isRedisAvailable = false;
    isRedisTried = true;
    logger.error(
      `📦 [Redis] connection failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    );
  }
});

// NodeCache 事件监听
cache.on("expired", (key) => {
  logger.info(`⏳ [NodeCache] Key "${key}" has expired.`);
});

cache.on("del", (key) => {
  logger.info(`🗑️ [NodeCache] Key "${key}" has been deleted.`);
});

/**
 * 从缓存中获取数据
 * @param key 缓存键
 * @param ttl 兜底缓存过期时间（ 秒 ）
 * @returns 缓存数据
 */
export const getCache = async (
  key: string,
  ttl: number = config.CACHE_TTL,
): Promise<CacheData | undefined> => {
  const normalizedTtl = normalizeCacheTtl(ttl);
  await ensureRedisConnection();
  if (isRedisAvailable) {
    try {
      const redisResult = await redis.get(key);
      if (redisResult) {
        const cachedData = parse(redisResult) as CacheData;
        const redisTtl = await redis.ttl(key);
        const decision = resolveRedisCacheHit(cachedData, redisTtl, normalizedTtl);

        if (decision.action === "miss") {
          await redis.del(key);
          cache.del(key);
          logger.info(`⏳ [Redis] Key "${key}" has no TTL and is stale.`);
          return undefined;
        }

        if (decision.repairTtl) {
          await redis.expire(key, decision.repairTtl);
          logger.info(`⏳ [Redis] Key "${key}" TTL has been repaired.`);
        }

        return cachedData;
      }
    } catch (error) {
      logger.error(
        `📦 [Redis] get error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
  return cache.get(key);
};

/**
 * 将数据写入缓存
 * @param key 缓存键
 * @param value 缓存值
 * @param ttl 缓存过期时间（ 秒 ）
 * @returns 是否写入成功
 */
export const setCache = async (
  key: string,
  value: CacheData,
  ttl: number = config.CACHE_TTL,
): Promise<boolean> => {
  const normalizedTtl = normalizeCacheTtl(ttl);
  // 尝试写入 Redis
  if (isRedisAvailable && !Buffer.isBuffer(value?.data)) {
    try {
      await redis.set(key, stringify(value), "EX", normalizedTtl);
      if (logger) logger.info(`💾 [REDIS] ${key} has been cached`);
    } catch (error) {
      logger.error(
        `📦 [Redis] set error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
  const success = cache.set(key, value, normalizedTtl);
  if (logger) logger.info(`💾 [NodeCache] ${key} has been cached`);
  return success;
};

/**
 * 从缓存中删除数据
 * @param key 缓存键
 * @returns 是否删除成功
 */
export const delCache = async (key: string): Promise<boolean> => {
  let redisSuccess = true;
  try {
    await redis.del(key);
    logger.info(`🗑️ [REDIS] ${key} has been deleted from Redis`);
  } catch (error) {
    redisSuccess = false;
    logger.error(
      `📦 [Redis] del error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
  // 尝试删除 NodeCache
  const nodeCacheSuccess = cache.del(key) > 0;
  if (logger) logger.info(`🗑️ [CACHE] ${key} has been deleted from NodeCache`);
  return redisSuccess && nodeCacheSuccess;
};
