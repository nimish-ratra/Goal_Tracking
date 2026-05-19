const express = require('express');
const { createCheckIn, getMyCheckIns, getTeamCheckIns, addManagerComment } = require('../controllers/checkinController');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

router.post('/', authorizeRoles('EMPLOYEE'), createCheckIn);
router.get('/my/:quarterId', authorizeRoles('EMPLOYEE'), getMyCheckIns);
router.get('/team/:quarterId', authorizeRoles('MANAGER'), getTeamCheckIns);
router.post('/:quarterlyDataId/manager-comment', authorizeRoles('MANAGER'), addManagerComment);

module.exports = router;
