const express = require("express");
const authenticate = require("../middleware/auth");
const searchRateLimiter = require("../middleware/rateLimit");
const {
  search,
  suggest,
} = require("../controllers/searchController");

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

module.exports = router;