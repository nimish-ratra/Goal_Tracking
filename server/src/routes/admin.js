const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { syncAzureOrg } = require('../controllers/adminController');

const router = express.Router();

router.use(authenticate, authorizeRoles('ADMIN'));

router.post('/sync-azure-org', syncAzureOrg);

module.exports = router;
