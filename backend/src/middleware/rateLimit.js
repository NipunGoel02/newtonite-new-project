const { rateLimit } = require("express-rate-limit");

const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many searches. Please try again later.",
  },
  handler: (req, res, next, options) => {
    const retryAfter = Math.ceil(options.windowMs / 1000);

    res.set("Retry-After", retryAfter);

    res.status(429).json({
      success: false,
      message: "Too many searches. Please try again later.",
    });
  },
});

module.exports = searchRateLimiter;