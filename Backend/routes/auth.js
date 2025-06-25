// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// URL final: /api/auth/register
router.post('/register', registerUser);

// URL final: /api/auth/login
router.post('/login', loginUser);

module.exports = router;