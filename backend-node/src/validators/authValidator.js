const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(1, 'The name field is required.').max(255),
  email: z.string().email('The email field must be a valid email address.').max(255),
  password: z.string().min(8, 'The password field must be at least 8 characters.'),
  password_confirmation: z.string().optional(),
  organization_name: z.string().min(1, 'The organization name field is required.').max(255),
}).refine(
  (data) => !data.password_confirmation || data.password === data.password_confirmation,
  {
    message: 'The password confirmation does not match.',
    path: ['password_confirmation'],
  }
);

const loginSchema = z.object({
  email: z.string().email('The email field must be a valid email address.'),
  password: z.string().min(1, 'The password field is required.'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('The email field must be a valid email address.'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('The email field must be a valid email address.'),
  token: z.string().optional().nullable(),
  password: z.string().min(8, 'The password field must be at least 8 characters.'),
  password_confirmation: z.string().optional(),
}).refine(
  (data) => !data.password_confirmation || data.password === data.password_confirmation,
  {
    message: 'The password confirmation does not match.',
    path: ['password_confirmation'],
  }
);

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
