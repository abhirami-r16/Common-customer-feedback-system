/**
 * Middleware factory for validating request body, query, or params with a Zod schema
 */
function validate(schema, source = 'body') {
  return async (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const parsed = await schema.parseAsync(dataToValidate);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err.name === 'ZodError') {
        const formattedErrors = {};
        for (const issue of err.issues) {
          const path = issue.path.length > 0 ? issue.path.join('.') : 'general';
          if (!formattedErrors[path]) {
            formattedErrors[path] = [];
          }
          formattedErrors[path].push(issue.message);
        }

        return res.status(422).json({
          message: issueFirstMessage(err) || 'The given data was invalid.',
          errors: formattedErrors,
        });
      }
      next(err);
    }
  };
}

function issueFirstMessage(zodError) {
  if (zodError.issues && zodError.issues.length > 0) {
    return zodError.issues[0].message;
  }
  return 'Validation failed.';
}

module.exports = {
  validate,
};
