const express = require('express');
const { getAchievementReport, exportAchievementReport, getCompletionReport, getAuditLogs, getDashboardAnalytics } = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

router.get('/dashboard', getDashboardAnalytics);
router.get('/achievement', authorizeRoles('ADMIN', 'MANAGER'), getAchievementReport);
router.get('/achievement/export', authorizeRoles('ADMIN', 'MANAGER'), exportAchievementReport);
router.get('/completion', authorizeRoles('ADMIN', 'MANAGER'), getCompletionReport);
router.get('/audit', authorizeRoles('ADMIN'), getAuditLogs);

module.exports = router;
