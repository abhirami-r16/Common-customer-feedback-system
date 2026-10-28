const db = require('../config/database');
const { generateSlug } = require('../utils/slug');

/**
 * Helper to fetch complete nested form with sections, questions, and options
 */
async function getFullForm(formId) {
  const forms = await db.query('SELECT * FROM feedback_forms WHERE id = ?', [formId]);
  if (forms.length === 0) return null;

  const form = forms[0];

  const sections = await db.query(
    'SELECT * FROM form_sections WHERE feedback_form_id = ? ORDER BY position ASC, id ASC',
    [formId]
  );

  const sectionIds = sections.map(s => s.id);
  let questions = [];
  if (sectionIds.length > 0) {
    const placeholders = sectionIds.map(() => '?').join(',');
    questions = await db.query(
      `SELECT * FROM form_questions WHERE form_section_id IN (${placeholders}) ORDER BY position ASC, id ASC`,
      sectionIds
    );
  }

  const questionIds = questions.map(q => q.id);
  let options = [];
  if (questionIds.length > 0) {
    const placeholders = questionIds.map(() => '?').join(',');
    options = await db.query(
      `SELECT * FROM question_options WHERE form_question_id IN (${placeholders}) ORDER BY position ASC, id ASC`,
      questionIds
    );
  }

  // Nest options inside questions
  const questionsBySection = {};
  for (const q of questions) {
    let settings = q.settings;
    if (typeof settings === 'string') {
      try {
        settings = JSON.parse(settings);
      } catch {
        settings = null;
      }
    }

    const qOptions = options.filter(o => o.form_question_id === q.id);
    const enrichedQ = {
      ...q,
      is_required: Boolean(q.is_required),
      settings,
      options: qOptions,
    };

    if (!questionsBySection[q.form_section_id]) {
      questionsBySection[q.form_section_id] = [];
    }
    questionsBySection[q.form_section_id].push(enrichedQ);
  }

  // Nest questions inside sections
  form.sections = sections.map(s => ({
    ...s,
    questions: questionsBySection[s.id] || [],
  }));

  return form;
}

/**
 * Get complete nested structure of a form owned by authenticated user
 */
async function show(req, res, next) {
  try {
    const userId = req.user.id;
    const formId = parseInt(req.params.id, 10);

    const forms = await db.query('SELECT id, user_id FROM feedback_forms WHERE id = ? LIMIT 1', [formId]);
    if (forms.length === 0) {
      return res.status(404).json({ message: 'Feedback form not found.' });
    }

    if (forms[0].user_id !== userId) {
      return res.status(403).json({
        message: 'Unauthorized: You do not own this feedback form.',
      });
    }

    const form = await getFullForm(formId);

    res.status(200).json({
      form,
      data: form,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Save (create or update) complete nested form structure in a transaction
 */
async function save(req, res, next) {
  try {
    const userId = req.user.id;
    const { id, title, description, status, sections } = req.body;

    // If updating, verify ownership first
    let formId = id ? parseInt(id, 10) : null;
    if (formId) {
      const existing = await db.query(
        'SELECT id, user_id FROM feedback_forms WHERE id = ? LIMIT 1',
        [formId]
      );
      if (existing.length === 0) {
        return res.status(404).json({ message: 'Feedback form not found.' });
      }
      if (existing[0].user_id !== userId) {
        return res.status(403).json({
          message: 'Unauthorized: You do not own this feedback form.',
        });
      }
    }

    const savedFormId = await db.transaction(async (conn) => {
      // 1. Create or update form
      if (formId) {
        await conn.execute(
          `UPDATE feedback_forms 
           SET title = ?, description = ?, status = ?, updated_at = NOW() 
           WHERE id = ?`,
          [title.trim(), description ? description.trim() : null, status, formId]
        );
      } else {
        const slug = generateSlug(title);
        const [formResult] = await conn.execute(
          `INSERT INTO feedback_forms (user_id, title, description, slug, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [userId, title.trim(), description ? description.trim() : null, slug, status]
        );
        formId = formResult.insertId;
      }

      const incomingSectionIds = [];
      const incomingQuestionIds = [];
      const incomingOptionIds = [];

      // 2. Process Sections
      for (let sIdx = 0; sIdx < (sections || []).length; sIdx++) {
        const secData = sections[sIdx];
        const secPos = secData.position !== undefined ? secData.position : sIdx;
        let sectionId = secData.id && typeof secData.id === 'number' ? secData.id : null;

        if (sectionId) {
          // Verify section belongs to this form
          const [secExisting] = await conn.execute(
            'SELECT id FROM form_sections WHERE id = ? AND feedback_form_id = ?',
            [sectionId, formId]
          );
          if (secExisting.length > 0) {
            await conn.execute(
              `UPDATE form_sections 
               SET title = ?, description = ?, position = ?, updated_at = NOW() 
               WHERE id = ?`,
              [secData.title.trim(), secData.description || null, secPos, sectionId]
            );
          } else {
            sectionId = null;
          }
        }

        if (!sectionId) {
          const [secResult] = await conn.execute(
            `INSERT INTO form_sections (feedback_form_id, title, description, position, created_at, updated_at)
             VALUES (?, ?, ?, ?, NOW(), NOW())`,
            [formId, secData.title.trim(), secData.description || null, secPos]
          );
          sectionId = secResult.insertId;
        }

        incomingSectionIds.push(sectionId);

        // 3. Process Questions inside section
        for (let qIdx = 0; qIdx < (secData.questions || []).length; qIdx++) {
          const qData = secData.questions[qIdx];
          const qPos = qData.position !== undefined ? qData.position : qIdx;
          const isReq = qData.is_required ? 1 : 0;
          const settingsJson = qData.settings ? JSON.stringify(qData.settings) : null;
          let questionId = qData.id && typeof qData.id === 'number' ? qData.id : null;

          if (questionId) {
            const [qExisting] = await conn.execute(
              'SELECT id FROM form_questions WHERE id = ? AND form_section_id = ?',
              [questionId, sectionId]
            );
            if (qExisting.length > 0) {
              await conn.execute(
                `UPDATE form_questions 
                 SET question_text = ?, question_type = ?, is_required = ?, settings = ?, position = ?, updated_at = NOW() 
                 WHERE id = ?`,
                [qData.question_text.trim(), qData.question_type, isReq, settingsJson, qPos, questionId]
              );
            } else {
              questionId = null;
            }
          }

          if (!questionId) {
            const [qResult] = await conn.execute(
              `INSERT INTO form_questions (form_section_id, question_text, question_type, is_required, settings, position, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [sectionId, qData.question_text.trim(), qData.question_type, isReq, settingsJson, qPos]
            );
            questionId = qResult.insertId;
          }

          incomingQuestionIds.push(questionId);

          // 4. Process Options for choice questions
          if (['multiple_choice', 'checkboxes', 'dropdown'].includes(qData.question_type)) {
            for (let oIdx = 0; oIdx < (qData.options || []).length; oIdx++) {
              const optData = qData.options[oIdx];
              const optPos = optData.position !== undefined ? optData.position : oIdx;
              let optionId = optData.id && typeof optData.id === 'number' ? optData.id : null;

              if (optionId) {
                const [optExisting] = await conn.execute(
                  'SELECT id FROM question_options WHERE id = ? AND form_question_id = ?',
                  [optionId, questionId]
                );
                if (optExisting.length > 0) {
                  await conn.execute(
                    `UPDATE question_options 
                     SET option_text = ?, position = ?, updated_at = NOW() 
                     WHERE id = ?`,
                    [optData.option_text.trim(), optPos, optionId]
                  );
                } else {
                  optionId = null;
                }
              }

              if (!optionId) {
                const [optResult] = await conn.execute(
                  `INSERT INTO question_options (form_question_id, option_text, position, created_at, updated_at)
                   VALUES (?, ?, ?, NOW(), NOW())`,
                  [questionId, optData.option_text.trim(), optPos]
                );
                optionId = optResult.insertId;
              }

              incomingOptionIds.push(optionId);
            }
          }
        }
      }

      // 5. Cleanup removed entities
      if (incomingSectionIds.length > 0) {
        const secPlaceholders = incomingSectionIds.map(() => '?').join(',');
        await conn.execute(
          `DELETE FROM form_sections 
           WHERE feedback_form_id = ? AND id NOT IN (${secPlaceholders})`,
          [formId, ...incomingSectionIds]
        );
      }

      if (incomingQuestionIds.length > 0 && incomingSectionIds.length > 0) {
        const qPlaceholders = incomingQuestionIds.map(() => '?').join(',');
        const sPlaceholders = incomingSectionIds.map(() => '?').join(',');
        await conn.execute(
          `DELETE FROM form_questions 
           WHERE form_section_id IN (${sPlaceholders}) AND id NOT IN (${qPlaceholders})`,
          [...incomingSectionIds, ...incomingQuestionIds]
        );
      }

      if (incomingOptionIds.length > 0 && incomingQuestionIds.length > 0) {
        const optPlaceholders = incomingOptionIds.map(() => '?').join(',');
        const qPlaceholders = incomingQuestionIds.map(() => '?').join(',');
        await conn.execute(
          `DELETE FROM question_options 
           WHERE form_question_id IN (${qPlaceholders}) AND id NOT IN (${optPlaceholders})`,
          [...incomingQuestionIds, ...incomingOptionIds]
        );
      }

      return formId;
    });

    const fullForm = await getFullForm(savedFormId);
    const actionText = fullForm.status === 'published' ? 'published' : 'saved as draft';

    res.status(200).json({
      message: `Form successfully ${actionText}.`,
      form: fullForm,
      data: fullForm,
      share_url: `/f/${fullForm.slug}`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Quick status update
 */
async function updateStatus(req, res, next) {
  try {
    const userId = req.user.id;
    const formId = parseInt(req.params.id, 10);
    const { status } = req.body;

    const forms = await db.query('SELECT id, user_id FROM feedback_forms WHERE id = ? LIMIT 1', [formId]);
    if (forms.length === 0) {
      return res.status(404).json({ message: 'Feedback form not found.' });
    }

    if (forms[0].user_id !== userId) {
      return res.status(403).json({
        message: 'Unauthorized: You do not own this feedback form.',
      });
    }

    await db.execute('UPDATE feedback_forms SET status = ?, updated_at = NOW() WHERE id = ?', [status, formId]);

    res.status(200).json({
      message: 'Form status updated successfully.',
      status,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Public endpoint to view a form
 */
async function publicView(req, res, next) {
  try {
    const { slug } = req.params;
    const clientToken = req.query.client_token;

    const forms = await db.query(
      `SELECT f.*, u.name as user_name, u.organization_name
       FROM feedback_forms f
       LEFT JOIN users u ON f.user_id = u.id
       WHERE f.slug = ?
       LIMIT 1`,
      [slug]
    );

    if (forms.length === 0) {
      return res.status(404).json({ message: 'Feedback form not found.' });
    }

    const form = forms[0];
    const fullForm = await getFullForm(form.id);

    let alreadySubmitted = false;
    if (clientToken) {
      const submissions = await db.query(
        'SELECT id FROM feedback_submissions WHERE feedback_form_id = ? AND client_token = ? LIMIT 1',
        [form.id, clientToken]
      );
      alreadySubmitted = submissions.length > 0;
    }

    const formData = {
      id: form.id,
      title: form.title,
      description: form.description,
      slug: form.slug,
      already_submitted: alreadySubmitted,
      user: {
        business_name: form.organization_name || form.user_name || 'Customer Feedback',
      },
      sections: fullForm.sections,
    };

    res.status(200).json({
      form: formData,
      data: formData,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Public endpoint to submit customer feedback response
 */
async function submitFeedback(req, res, next) {
  try {
    const { slug } = req.params;
    const forms = await db.query('SELECT * FROM feedback_forms WHERE slug = ? LIMIT 1', [slug]);
    if (forms.length === 0) {
      return res.status(404).json({ message: 'Feedback form not found.' });
    }

    const form = forms[0];
    const answers = req.body.answers || {};
    let customerName = req.body.customer_name ? req.body.customer_name.trim() : null;
    let customerEmail = req.body.customer_email ? req.body.customer_email.trim().toLowerCase() : null;
    const clientToken = req.body.client_token ? req.body.client_token.trim() : null;
    const ip = req.ip || req.connection?.remoteAddress || '';

    // Load form questions to parse answers and check types
    const fullForm = await getFullForm(form.id);

    let rating = null;
    const summaryParts = [];
    const detailedAnswers = [];

    for (const sec of fullForm.sections || []) {
      for (const q of sec.questions || []) {
        if (answers[q.id] !== undefined) {
          const ans = answers[q.id];
          const ansStr = Array.isArray(ans) ? ans.join(', ') : String(ans);
          summaryParts.push(`${q.question_text}: ${ansStr}`);
          detailedAnswers.push({
            question: q.question_text,
            type: q.question_type,
            answer: ans,
          });

          if (['star_rating', 'numeric_rating'].includes(q.question_type)) {
            if (rating === null && !isNaN(ans) && ans !== '') {
              rating = parseInt(ans, 10);
            }
          } else if (q.question_type === 'email' && !customerEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailRegex.test(String(ans).trim())) {
              customerEmail = String(ans).trim().toLowerCase();
            }
          } else if (q.question_type === 'short_text' && !customerName && /name/i.test(q.question_text)) {
            customerName = String(ans).slice(0, 100).trim();
          }
        }
      }
    }

    // Anti-duplicate protection: check client_token OR customer_email
    let alreadySubmitted = false;
    const duplicateConditions = [];
    const duplicateParams = [form.id];

    if (clientToken) {
      duplicateConditions.push('client_token = ?');
      duplicateParams.push(clientToken);
    }
    if (customerEmail) {
      duplicateConditions.push('LOWER(customer_email) = ?');
      duplicateParams.push(customerEmail);
    }

    if (duplicateConditions.length > 0) {
      const duplicateSql = `SELECT id FROM feedback_submissions 
                            WHERE feedback_form_id = ? AND (${duplicateConditions.join(' OR ')}) 
                            LIMIT 1`;
      const duplicateRows = await db.query(duplicateSql, duplicateParams);
      alreadySubmitted = duplicateRows.length > 0;
    }

    if (alreadySubmitted) {
      return res.status(422).json({
        message: 'You have already submitted a response for this feedback form. Each user can submit only once.',
        already_submitted: true,
      });
    }

    const summaryPreview = summaryParts.slice(0, 3).join(' | ');

    const result = await db.execute(
      `INSERT INTO feedback_submissions 
       (feedback_form_id, customer_name, customer_email, ip_address, client_token, rating, summary_preview, review_status, internal_notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        form.id,
        customerName || 'Anonymous Customer',
        customerEmail || null,
        ip,
        clientToken || null,
        rating || 5,
        summaryPreview || null,
        'new',
        JSON.stringify(detailedAnswers),
      ]
    );

    res.status(200).json({
      message: 'Thank you! Your feedback has been successfully submitted.',
      submission_id: result.insertId,
      already_submitted: true,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  show,
  save,
  updateStatus,
  publicView,
  submitFeedback,
};
