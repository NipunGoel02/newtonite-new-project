const { redis, connectRedis } = require("../redis/client");

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 30;

const rateLimit = async (req, res, next) => {
  try {
    await connectRedis();

    const identifier = req.user?.id
      ? `user:${req.user.id}`
      : `ip:${req.ip}`;

    const key = `rate_limit:${identifier}`;

    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }

    if (count > MAX_REQUESTS) {
      const ttl = await redis.ttl(key);

      res.set("Retry-After", String(Math.max(ttl, 1)));

      return res.status(429).json({
        success: false,
        message: "Too many requests",
        retryAfter: Math.max(ttl, 1),
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = rateLimit;