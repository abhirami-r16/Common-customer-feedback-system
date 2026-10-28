const { z } = require('zod');

const updateRoleSchema = z.object({
  role: z.enum(['business', 'admin', 'user'], {
    errorMap: () => ({ message: 'The role field must be one of: business, admin, user.' }),
  }),
});

module.exports = {
  updateRoleSchema,
};
