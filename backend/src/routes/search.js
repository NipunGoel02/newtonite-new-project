const express = require("express");

const authenticate = require("../middleware/auth");
const searchRateLimiter = require("../middleware/rateLimit");

const {
  search,
  suggest,
} = require("../controllers/searchController");

const {
  getTrendingSearches,
} = require("../redis/trending");

const router = express.Router();

router.get(
  "/",
  authenticate,
  searchRateLimiter,
  search
);

router.get(
  "/suggest",
  authenticate,
  suggest
);

router.get(
  "/trending",
  authenticate,
  async (req, res, next) => {
    try {
      const limit = Math.min(
        Math.max(Number(req.query.limit) || 10, 1),
        50
      );

      const trending = await getTrendingSearches(limit);

      res.json({
        success: true,
        trending,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;