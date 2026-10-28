const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { updateRoleSchema } = require('../validators/adminValidator');

// All routes require authentication and role: admin
router.use(authenticate, requireRole('admin'));

// Platform Stats
router.get('/stats', adminController.stats);

// Users Management
router.get('/users', adminController.users);
router.get('/featured-users', adminController.featuredUsers); // Registered before /users/:id
router.get('/users/:id', adminController.showUser);
router.patch('/users/:id/role', validate(updateRoleSchema), adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// Forms Management
router.get('/forms', adminController.forms);
router.delete('/forms/:id', adminController.destroyForm);

// Responses Management
router.get('/responses', adminController.responses);
router.delete('/responses/:id', adminController.destroyResponse);

module.exports = router;
