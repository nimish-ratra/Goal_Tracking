const express = require('express');
const { getGoals, getGoal, createGoal, updateGoal, deleteGoal, submitGoalSheet, approveGoal, returnGoal, unlockGoal } = require('../controllers/goalController');
const { pushSharedGoal, updateSharedWeightage, syncAchievement } = require('../controllers/sharedGoalController');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

router.get('/', getGoals);
router.post('/', authorizeRoles('EMPLOYEE'), createGoal);
router.get('/:id', getGoal);
router.patch('/:id', updateGoal);
router.delete('/:id', authorizeRoles('EMPLOYEE'), deleteGoal);

router.post('/:id/submit', authorizeRoles('EMPLOYEE'), submitGoalSheet);
router.post('/:id/approve', authorizeRoles('MANAGER', 'ADMIN'), approveGoal);
router.post('/:id/return', authorizeRoles('MANAGER', 'ADMIN'), returnGoal);
router.post('/:id/unlock', authorizeRoles('ADMIN'), unlockGoal);

// Shared Goals
router.post('/shared/push', authorizeRoles('MANAGER', 'ADMIN'), pushSharedGoal);
router.patch('/shared/:id/weightage', updateSharedWeightage);
router.post('/shared/:sharedGroupId/sync-achievement', authorizeRoles('MANAGER', 'ADMIN'), syncAchievement);

module.exports = router;
