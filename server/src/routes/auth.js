const express = require('express');
const { body } = require('express-validator');
const { login, refresh, logout, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

const { handleAzureSSO } = require('../controllers/azureSsoController');

router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], validate, login);

router.post('/azure-sso', [
  body('accessToken').notEmpty().withMessage('Access token is required')
], validate, handleAzureSSO);

router.post('/refresh', refresh);
router.post('/logout', logout);

router.get('/me', authenticate, getMe);

module.exports = router;
