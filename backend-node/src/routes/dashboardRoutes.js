const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const formBuilderController = require('../controllers/formBuilderController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const {
  storeFormSchema,
  updateStatusSchema,
  formBuilderSaveSchema,
} = require('../validators/formValidator');

// All routes here require authentication and role: business
router.use(authenticate, requireRole('business'));

// Dashboard Stats
router.get('/dashboard/stats', dashboardController.stats);

// Forms Management
router.get('/forms', dashboardController.forms);
router.post('/forms', validate(storeFormSchema), dashboardController.storeForm);

// Form Builder Save (Registered before /forms/:id to prevent route collision)
router.post('/forms/builder', validate(formBuilderSaveSchema), formBuilderController.save);

// Single Form Operations
router.get('/forms/:id', formBuilderController.show);
router.delete('/forms/:id', dashboardController.destroyForm);
router.patch('/forms/:id/status', validate(updateStatusSchema), formBuilderController.updateStatus);
router.get('/forms/:id/responses', dashboardController.formResponses);

// Responses Management
router.get('/responses', dashboardController.responses);
router.get('/responses/:id', dashboardController.showResponse);
router.delete('/responses/:id', dashboardController.destroyResponse);

module.exports = router;
