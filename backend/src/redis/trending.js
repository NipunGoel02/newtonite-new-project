const { redis, connectRedis } = require("./client");

const TRENDING_KEY = "trending:searches";

const incrementSearch = async (searchQuery) => {
  await connectRedis();

  const query = String(searchQuery).trim().toLowerCase();

  if (!query) {
    return;
  }

  await redis.zIncrBy(TRENDING_KEY, 1, query);
};

const getTrendingSearches = async (limit = 10) => {
  await connectRedis();

  const results = await redis.zRangeWithScores(
    TRENDING_KEY,
    0,
    Math.max(Number(limit) - 1, 0),
    {
      REV: true,
    }
  );

  return results.map((item) => ({
    query: item.value,
    count: Number(item.score),
  }));
};

module.exports = {
  incrementSearch,
  getTrendingSearches,
};