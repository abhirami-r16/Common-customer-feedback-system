const { z } = require('zod');

const storeFormSchema = z.object({
  title: z.string().min(1, 'The title field is required.').max(255),
  description: z.string().optional().nullable(),
  status: z.enum(['draft', 'published', 'unpublished']).optional().default('draft'),
});

const updateStatusSchema = z.object({
  status: z.enum(['draft', 'published', 'unpublished'], {
    errorMap: () => ({ message: 'Status must be one of: draft, published, unpublished.' }),
  }),
});

const questionOptionSchema = z.object({
  id: z.union([z.number(), z.string(), z.null()]).optional(),
  option_text: z.string().min(1, 'Option text is required.'),
  position: z.number().int().optional().default(0),
});

const formQuestionSchema = z.object({
  id: z.union([z.number(), z.string(), z.null()]).optional(),
  question_text: z.string().min(1, 'Question text is required.'),
  question_type: z.string().min(1, 'Question type is required.'),
  is_required: z.boolean().optional().default(false),
  settings: z.any().optional().nullable(),
  position: z.number().int().optional().default(0),
  options: z.array(questionOptionSchema).optional().nullable(),
});

const formSectionSchema = z.object({
  id: z.union([z.number(), z.string(), z.null()]).optional(),
  title: z.string().min(1, 'Section title is required.').max(255),
  description: z.string().optional().nullable(),
  position: z.number().int().optional().default(0),
  questions: z.array(formQuestionSchema).optional().nullable(),
});

const formBuilderSaveSchema = z.object({
  id: z.union([z.number(), z.string(), z.null()]).optional(),
  title: z.string().min(1, 'Form title is required.').max(255),
  description: z.string().optional().nullable(),
  status: z.enum(['draft', 'published', 'unpublished']),
  sections: z.array(formSectionSchema).min(1, 'The form must contain at least one section.'),
}).superRefine((data, ctx) => {
  if (data.sections) {
    data.sections.forEach((section, sIdx) => {
      if (section.questions) {
        section.questions.forEach((q, qIdx) => {
          if (['multiple_choice', 'checkboxes', 'dropdown'].includes(q.question_type)) {
            const validOptions = (q.options || []).filter(o => o.option_text && o.option_text.trim() !== '');
            if (validOptions.length === 0) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Question "${q.question_text}" requires at least one answer option.`,
                path: ['sections', sIdx, 'questions', qIdx, 'options'],
              });
            }
          }
        });
      }
    });
  }
});

const submitFeedbackSchema = z.object({
  customer_name: z.string().optional().nullable(),
  customer_email: z.string().optional().nullable(),
  client_token: z.string().optional().nullable(),
  answers: z.record(z.any()).optional().default({}),
});

module.exports = {
  storeFormSchema,
  updateStatusSchema,
  formBuilderSaveSchema,
  submitFeedbackSchema,
};
