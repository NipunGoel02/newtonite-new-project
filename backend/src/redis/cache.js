const { redis, connectRedis } = require("./client");

const SEARCH_CACHE_TTL = 60;

const buildSearchCacheKey = (params) => {
  return `search:${JSON.stringify({
    q: params.q || "",
    tag: params.tag || "",
    author: params.author || "",
    from: params.from || "",
    to: params.to || "",
    page: params.page || 1,
    limit: params.limit || 10,
  })}`;
};

const getCachedSearch = async (params) => {
  await connectRedis();

  const key = buildSearchCacheKey(params);
  const cached = await redis.get(key);

  return cached ? JSON.parse(cached) : null;
};

const setCachedSearch = async (params, data) => {
  await connectRedis();

  const key = buildSearchCacheKey(params);

  await redis.setEx(
    key,
    SEARCH_CACHE_TTL,
    JSON.stringify(data)
  );
};

const invalidateSearchCache = async () => {
  await connectRedis();

  const keys = await redis.keys("search:*");

  if (keys.length > 0) {
    await redis.del(keys);
  }
};

module.exports = {
  buildSearchCacheKey,
  getCachedSearch,
  setCachedSearch,
  invalidateSearchCache,
};