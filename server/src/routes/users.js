const express = require('express');
const { getUsers, createUser, updateUser, getTeam } = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeRoles('ADMIN'), getUsers);
router.post('/', authorizeRoles('ADMIN'), createUser);
router.patch('/:id', authorizeRoles('ADMIN'), updateUser);

router.get('/team', authorizeRoles('MANAGER'), getTeam);

module.exports = router;
