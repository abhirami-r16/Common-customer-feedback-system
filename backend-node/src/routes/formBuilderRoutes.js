const express = require('express');
const router = express.Router();
const formBuilderController = require('../controllers/formBuilderController');
const { validate } = require('../middleware/validator');
const { submitFeedbackSchema } = require('../validators/formValidator');

// Public Form retrieval by slug
router.get('/public/forms/:slug', formBuilderController.publicView);

// Public Feedback submission by slug
router.post(
  '/public/forms/:slug/submit',
  validate(submitFeedbackSchema),
  formBuilderController.submitFeedback
);

module.exports = router;
