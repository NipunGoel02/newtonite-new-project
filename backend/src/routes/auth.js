const express = require("express");

const {
  register,
  login,
  refresh,
  logout,
  getMe,
} = require("../controllers/authController");

const authenticate = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);

module.exports = router;