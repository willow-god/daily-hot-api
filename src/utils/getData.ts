import type { Get, Post } from "../types.js";
import { config } from "../config.js";
import { getCache, setCache, delCache } from "./cache.js";
import logger from "./logger.js";
import axios from "axios";

// 基础配置
const request = axios.create({
  // 请求超时设置
  timeout: config.REQUEST_TIMEOUT,
  withCredentials: true,
});

// 请求拦截
request.interceptors.request.use(
  (request) => {
    if (!request.params) request.params = {};
    // 发送请求
    return request;
  },
  (error) => {
    logger.error("❌ [ERROR] request failed");
    return Promise.reject(error);
  },
);

// 响应拦截
request.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 继续传递错误
    return Promise.reject(error);
  },
);

export interface RequestResult<T = unknown> {
  fromCache: boolean;
  updateTime: string;
  data: T;
}

export const FORCE_REFRESH_COOLDOWN_MS = 30 * 1000;

export const shouldUseCacheDuringForceRefresh = (
  updateTime: string | undefined,
  nowMs: number = Date.now(),
  cooldownMs: number = FORCE_REFRESH_COOLDOWN_MS,
): boolean => {
  if (!updateTime) return false;

  const updateTimeMs = Date.parse(updateTime);
  if (!Number.isFinite(updateTimeMs)) return false;

  return nowMs - updateTimeMs < cooldownMs;
};

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;

  const objectValue = value as Record<string, unknown>;
  const entries = Object.keys(objectValue)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(objectValue[key])}`);
  return `{${entries.join(",")}}`;
};

export const createCacheKey = (method: "GET" | "POST", url: string, payload?: unknown): string => {
  if (
    !payload ||
    (typeof payload === "object" &&
      !Buffer.isBuffer(payload) &&
      !Array.isArray(payload) &&
      !Object.keys(payload).length)
  ) {
    return url;
  }

  if (method === "GET") {
    const params = payload as Record<string, string | number>;
    const query = Object.keys(params)
      .sort()
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key]))}`)
      .join("&");
    return `${url}${url.includes("?") ? "&" : "?"}${query}`;
  }

  const body = Buffer.isBuffer(payload) ? payload.toString("base64") : stableStringify(payload);
  return `POST:${url}:body=${body}`;
};

const createCachedResult = <T>(cachedData: {
  updateTime: string;
  data: unknown;
}): RequestResult<T> => ({
  fromCache: true,
  updateTime: cachedData.updateTime,
  data: cachedData.data as T,
});

const getCachedResult = async <T>(
  cacheKey: string,
  ttl: number,
): Promise<RequestResult<T> | undefined> => {
  const cachedData = await getCache(cacheKey, ttl);
  if (!cachedData) return undefined;

  logger.info("[CACHE] The request is cached");
  return createCachedResult<T>(cachedData);
};

const getForceRefreshCooldownCache = async <T>(
  cacheKey: string,
  ttl: number,
): Promise<RequestResult<T> | undefined> => {
  const cachedData = await getCache(cacheKey, ttl);
  if (!cachedData || !shouldUseCacheDuringForceRefresh(cachedData.updateTime)) return undefined;

  logger.info("[CACHE] cache=false ignored during force refresh cooldown");
  return createCachedResult<T>(cachedData);
};

// GET
export const get = async <T = unknown>(options: Get): Promise<RequestResult<T>> => {
  const {
    url,
    headers,
    params,
    noCache,
    ttl = config.CACHE_TTL,
    originaInfo = false,
    responseType = "json",
  } = options;
  const cacheKey = createCacheKey("GET", url, params);
  logger.info(`🌐 [GET] ${url}`);
  try {
    // 检查缓存
    if (noCache) {
      const cooldownCache = await getForceRefreshCooldownCache<T>(cacheKey, ttl);
      if (cooldownCache) return cooldownCache;
      await delCache(cacheKey);
    } else {
      const cachedResult = await getCachedResult<T>(cacheKey, ttl);
      if (cachedResult) return cachedResult;
    }
    // 缓存不存在时请求接口
    const response = await request.get(url, { headers, params, responseType });
    const responseData = response?.data || response;
    // 存储新获取的数据到缓存
    const updateTime = new Date().toISOString();
    const data = originaInfo ? response : responseData;
    await setCache(cacheKey, { data, updateTime }, ttl);
    // 返回数据
    logger.info(`✅ [${response?.status}] request was successful`);
    return { fromCache: false, updateTime, data: data as T };
  } catch (error) {
    logger.error("❌ [ERROR] request failed");
    throw error;
  }
};

// POST
export const post = async <T = unknown>(options: Post): Promise<RequestResult<T>> => {
  const { url, headers, body, noCache, ttl = config.CACHE_TTL, originaInfo = false } = options;
  const cacheKey = createCacheKey("POST", url, body);
  logger.info(`🌐 [POST] ${url}`);
  try {
    // 检查缓存
    if (noCache) {
      const cooldownCache = await getForceRefreshCooldownCache<T>(cacheKey, ttl);
      if (cooldownCache) return cooldownCache;
      await delCache(cacheKey);
    } else {
      const cachedResult = await getCachedResult<T>(cacheKey, ttl);
      if (cachedResult) return cachedResult;
    }
    // 缓存不存在时请求接口
    const response = await request.post(url, body, { headers });
    const responseData = response?.data || response;
    // 存储新获取的数据到缓存
    const updateTime = new Date().toISOString();
    const data = originaInfo ? response : responseData;
    await setCache(cacheKey, { data, updateTime }, ttl);
    // 返回数据
    logger.info(`✅ [${response?.status}] request was successful`);
    return { fromCache: false, updateTime, data: data as T };
  } catch (error) {
    logger.error("❌ [ERROR] request failed");
    throw error;
  }
};
