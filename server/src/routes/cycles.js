const express = require('express');
const { getCycles, getActiveCycle, createCycle, activateCycle, getQuarters } = require('../controllers/cycleController');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

router.get('/', getCycles);
router.get('/active', getActiveCycle);
router.post('/', authorizeRoles('ADMIN'), createCycle);
router.patch('/:id/activate', authorizeRoles('ADMIN'), activateCycle);
router.get('/:id/quarters', getQuarters);

module.exports = router;
