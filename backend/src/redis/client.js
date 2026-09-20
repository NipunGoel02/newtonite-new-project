const { createClient } = require("redis");
const config = require("../config");

const redis = createClient({
  url: config.redisUrl,
});

redis.on("error", (error) => {
  console.error("Redis error:", error);
});

const connectRedis = async () => {
  if (!redis.isOpen) {
    await redis.connect();
  }
};

module.exports = {
  redis,
  connectRedis,
};