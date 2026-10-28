const db = require('../config/database');
const { generateSlug } = require('../utils/slug');
const { paginate } = require('../utils/pagination');
const { formatDate, formatDateTime, diffForHumans } = require('../utils/responseHelper');

/**
 * Get aggregated metrics, charts, and recent items for business overview
 */
async function stats(req, res, next) {
  try {
    const userId = req.user.id;
    let days = parseInt(req.query.days || '30', 10);
    if (![7, 30, 90].includes(days)) {
      days = 30;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    const startDateStr = startDate.toISOString().slice(0, 19).replace('T', ' ');

    // 1. Form statistics
    const formCounts = await db.query(
      `SELECT 
         COUNT(*) as total_forms,
         SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_forms,
         SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_forms
       FROM feedback_forms
       WHERE user_id = ?`,
      [userId]
    );

    const totalForms = Number(formCounts[0]?.total_forms || 0);
    const publishedForms = Number(formCounts[0]?.published_forms || 0);
    const draftForms = Number(formCounts[0]?.draft_forms || 0);

    // 2. Submissions statistics across user's forms
    const submissionStats = await db.query(
      `SELECT 
         COUNT(s.id) as total_responses,
         AVG(s.rating) as avg_rating,
         COUNT(s.rating) as total_rated_responses
       FROM feedback_submissions s
       JOIN feedback_forms f ON s.feedback_form_id = f.id
       WHERE f.user_id = ?`,
      [userId]
    );

    const totalResponses = Number(submissionStats[0]?.total_responses || 0);
    const avgRatingRaw = submissionStats[0]?.avg_rating;
    const averageRating = avgRatingRaw !== null && avgRatingRaw !== undefined ? Math.round(Number(avgRatingRaw) * 10) / 10 : null;
    const totalRatedResponses = Number(submissionStats[0]?.total_rated_responses || 0);

    // 3. 1-5 Star Rating Distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const ratingsRows = await db.query(
      `SELECT s.rating, COUNT(*) as count
       FROM feedback_submissions s
       JOIN feedback_forms f ON s.feedback_form_id = f.id
       WHERE f.user_id = ? AND s.rating IS NOT NULL
       GROUP BY s.rating`,
      [userId]
    );

    for (const row of ratingsRows) {
      const r = Number(row.rating);
      if (r >= 1 && r <= 5) {
        ratingDistribution[r] = Number(row.count);
      }
    }

    // 4. Response timeline over selected period
    const timelineRows = await db.query(
      `SELECT DATE(s.created_at) as date, COUNT(*) as count
       FROM feedback_submissions s
       JOIN feedback_forms f ON s.feedback_form_id = f.id
       WHERE f.user_id = ? AND s.created_at >= ?
       GROUP BY DATE(s.created_at)`,
      [userId, startDateStr]
    );

    const responsesInPeriod = {};
    for (const row of timelineRows) {
      const dateKey = typeof row.date === 'string' ? row.date.slice(0, 10) : new Date(row.date).toISOString().slice(0, 10);
      responsesInPeriod[dateKey] = Number(row.count);
    }

    const timeline = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().slice(0, 10);
      const label = `${months[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, '0')}`;
      timeline.push({
        date: dStr,
        label,
        count: responsesInPeriod[dStr] || 0,
      });
    }

    // 5. Recent forms (latest 5)
    const recentFormsRows = await db.query(
      `SELECT 
         f.id, f.title, f.slug, f.status, f.created_at,
         COUNT(s.id) as submissions_count,
         MAX(s.created_at) as last_response_at
       FROM feedback_forms f
       LEFT JOIN feedback_submissions s ON s.feedback_form_id = f.id
       WHERE f.user_id = ?
       GROUP BY f.id
       ORDER BY f.created_at DESC
       LIMIT 5`,
      [userId]
    );

    const recentForms = recentFormsRows.map(f => ({
      id: f.id,
      title: f.title,
      slug: f.slug,
      status: f.status,
      submissions_count: Number(f.submissions_count || 0),
      created_at: formatDate(f.created_at),
      last_response_at: f.last_response_at ? formatDate(f.last_response_at) : null,
      share_url: `/f/${f.slug}`,
    }));

    // 6. Recent responses (latest 5)
    const recentResponsesRows = await db.query(
      `SELECT 
         s.id, s.customer_name, s.rating, s.summary_preview, s.review_status, s.created_at,
         f.title as form_title
       FROM feedback_submissions s
       JOIN feedback_forms f ON s.feedback_form_id = f.id
       WHERE f.user_id = ?
       ORDER BY s.created_at DESC
       LIMIT 5`,
      [userId]
    );

    const recentResponses = recentResponsesRows.map(sub => ({
      id: sub.id,
      customer_name: sub.customer_name || 'Anonymous Customer',
      form_title: sub.form_title || 'Feedback Form',
      rating: sub.rating,
      summary_preview: sub.summary_preview || 'No additional comments provided.',
      review_status: sub.review_status,
      created_at: formatDate(sub.created_at),
    }));

    res.status(200).json({
      metrics: {
        total_forms: totalForms,
        published_forms: publishedForms,
        draft_forms: draftForms,
        total_responses: totalResponses,
        average_rating: averageRating,
        total_rated_responses: totalRatedResponses,
        response_rate: null,
        response_rate_note: 'Delivery logging is not applicable to open public forms.',
      },
      charts: {
        days,
        timeline,
        rating_distribution: ratingDistribution,
      },
      recent_forms: recentForms,
      recent_responses: recentResponses,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get paginated or searched forms for the user
 */
async function forms(req, res, next) {
  try {
    const userId = req.user.id;
    const search = req.query.search ? req.query.search.trim() : '';
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const perPage = 10;
    const offset = (page - 1) * perPage;

    let whereClause = 'WHERE f.user_id = ?';
    const params = [userId];

    if (search) {
      whereClause += ' AND f.title LIKE ?';
      params.push(`%${search}%`);
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM feedback_forms f ${whereClause}`,
      params
    );
    const total = Number(countResult[0]?.total || 0);

    const rows = await db.query(
      `SELECT 
         f.id, f.title, f.description, f.slug, f.status, f.created_at,
         COUNT(s.id) as submissions_count,
         MAX(s.created_at) as last_response_at
       FROM feedback_forms f
       LEFT JOIN feedback_submissions s ON s.feedback_form_id = f.id
       ${whereClause}
       GROUP BY f.id
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, perPage, offset]
    );

    const data = rows.map(f => ({
      id: f.id,
      title: f.title,
      description: f.description,
      slug: f.slug,
      status: f.status,
      submissions_count: Number(f.submissions_count || 0),
      created_at: formatDate(f.created_at),
      last_response_at: f.last_response_at ? formatDate(f.last_response_at) : null,
      share_url: `/f/${f.slug}`,
    }));

    const paginated = paginate({
      data,
      total,
      page,
      perPage,
      baseUrl: `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`,
    });

    res.status(200).json(paginated);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new form
 */
async function storeForm(req, res, next) {
  try {
    const userId = req.user.id;
    const { title, description, status = 'draft' } = req.body;
    const slug = generateSlug(title);

    const result = await db.execute(
      `INSERT INTO feedback_forms (user_id, title, description, slug, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, title.trim(), description ? description.trim() : null, slug, status]
    );

    const forms = await db.query('SELECT * FROM feedback_forms WHERE id = ?', [result.insertId]);

    res.status(201).json({
      message: 'Feedback form created successfully.',
      form: forms[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a form belonging to authenticated user
 */
async function destroyForm(req, res, next) {
  try {
    const userId = req.user.id;
    const formId = parseInt(req.params.id, 10);

    const existing = await db.query(
      'SELECT id FROM feedback_forms WHERE id = ? AND user_id = ? LIMIT 1',
      [formId, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Feedback form not found.' });
    }

    await db.execute('DELETE FROM feedback_forms WHERE id = ?', [formId]);

    res.status(200).json({
      message: 'Feedback form deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get customer submissions across user's forms with filters and ownership check
 */
async function responses(req, res, next) {
  try {
    const userId = req.user.id;
    const formIdParam = req.query.form_id ? parseInt(req.query.form_id, 10) : null;
    const ratingParam = req.query.rating ? parseInt(req.query.rating, 10) : null;
    const search = req.query.search ? req.query.search.trim() : '';
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const perPage = 15;
    const offset = (page - 1) * perPage;

    // If form_id requested, check ownership first
    if (formIdParam) {
      const owned = await db.query(
        'SELECT id FROM feedback_forms WHERE id = ? AND user_id = ? LIMIT 1',
        [formIdParam, userId]
      );
      if (owned.length === 0) {
        return res.status(403).json({
          message: 'Unauthorized: You do not own the requested feedback form.',
        });
      }
    }

    let whereClause = 'WHERE f.user_id = ?';
    const params = [userId];

    if (formIdParam) {
      whereClause += ' AND s.feedback_form_id = ?';
      params.push(formIdParam);
    }

    if (ratingParam) {
      whereClause += ' AND s.rating = ?';
      params.push(ratingParam);
    }

    if (search) {
      whereClause += ' AND (s.customer_name LIKE ? OR s.customer_email LIKE ? OR s.summary_preview LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as total 
       FROM feedback_submissions s
       JOIN feedback_forms f ON s.feedback_form_id = f.id
       ${whereClause}`,
      params
    );
    const total = Number(countResult[0]?.total || 0);

    const rows = await db.query(
      `SELECT 
         s.id, s.feedback_form_id, s.customer_name, s.customer_email, s.rating,
         s.summary_preview, s.review_status, s.internal_notes, s.created_at,
         f.title as form_title, f.slug as form_slug
       FROM feedback_submissions s
       JOIN feedback_forms f ON s.feedback_form_id = f.id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, perPage, offset]
    );

    const data = rows.map(sub => {
      let answers = null;
      if (sub.internal_notes) {
        try {
          answers = typeof sub.internal_notes === 'string' ? JSON.parse(sub.internal_notes) : sub.internal_notes;
        } catch {
          answers = null;
        }
      }

      return {
        id: sub.id,
        form_id: sub.feedback_form_id,
        form_title: sub.form_title || 'Feedback Form',
        customer_name: sub.customer_name || 'Anonymous Customer',
        customer_email: sub.customer_email,
        rating: sub.rating,
        summary_preview: sub.summary_preview || 'No comment provided.',
        review_status: sub.review_status,
        created_at: formatDate(sub.created_at),
        created_at_relative: diffForHumans(sub.created_at),
        answers,
      };
    });

    const paginated = paginate({
      data,
      total,
      page,
      perPage,
      baseUrl: `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`,
    });

    res.status(200).json(paginated);
  } catch (error) {
    next(error);
  }
}

/**
 * Get single response details with ownership check
 */
async function showResponse(req, res, next) {
  try {
    const userId = req.user.id;
    const responseId = parseInt(req.params.id, 10);

    const rows = await db.query(
      `SELECT 
         s.id, s.feedback_form_id, s.customer_name, s.customer_email, s.rating,
         s.summary_preview, s.review_status, s.internal_notes, s.created_at,
         f.id as form_id, f.title as form_title, f.slug as form_slug, f.user_id as form_user_id
       FROM feedback_submissions s
       JOIN feedback_forms f ON s.feedback_form_id = f.id
       WHERE s.id = ?
       LIMIT 1`,
      [responseId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Response not found.' });
    }

    const submission = rows[0];

    if (submission.form_user_id !== userId) {
      return res.status(403).json({
        message: 'Unauthorized: You do not own the feedback form associated with this response.',
      });
    }

    let answers = null;
    if (submission.internal_notes) {
      try {
        answers = typeof submission.internal_notes === 'string' ? JSON.parse(submission.internal_notes) : submission.internal_notes;
      } catch {
        answers = null;
      }
    }

    res.status(200).json({
      id: submission.id,
      form_id: submission.feedback_form_id,
      form_title: submission.form_title || 'Feedback Form',
      form_slug: submission.form_slug,
      customer_name: submission.customer_name || 'Anonymous Customer',
      customer_email: submission.customer_email,
      rating: submission.rating,
      summary_preview: submission.summary_preview || 'No comment provided.',
      review_status: submission.review_status,
      created_at: formatDateTime(submission.created_at),
      created_at_relative: diffForHumans(submission.created_at),
      answers,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get responses for a specific form owned by the authenticated business user
 */
async function formResponses(req, res, next) {
  try {
    const userId = req.user.id;
    const formId = parseInt(req.params.id, 10);
    const ratingParam = req.query.rating ? parseInt(req.query.rating, 10) : null;
    const search = req.query.search ? req.query.search.trim() : '';
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const perPage = 15;
    const offset = (page - 1) * perPage;

    const forms = await db.query(
      'SELECT id, title, slug, status, user_id FROM feedback_forms WHERE id = ? LIMIT 1',
      [formId]
    );

    if (forms.length === 0) {
      return res.status(404).json({ message: 'Feedback form not found.' });
    }

    const form = forms[0];
    if (form.user_id !== userId) {
      return res.status(403).json({
        message: 'Unauthorized: You do not own this feedback form.',
      });
    }

    let whereClause = 'WHERE s.feedback_form_id = ?';
    const params = [formId];

    if (ratingParam) {
      whereClause += ' AND s.rating = ?';
      params.push(ratingParam);
    }

    if (search) {
      whereClause += ' AND (s.customer_name LIKE ? OR s.customer_email LIKE ? OR s.summary_preview LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM feedback_submissions s ${whereClause}`,
      params
    );
    const total = Number(countResult[0]?.total || 0);

    const rows = await db.query(
      `SELECT 
         s.id, s.feedback_form_id, s.customer_name, s.customer_email, s.rating,
         s.summary_preview, s.review_status, s.internal_notes, s.created_at
       FROM feedback_submissions s
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, perPage, offset]
    );

    const data = rows.map(sub => {
      let answers = null;
      if (sub.internal_notes) {
        try {
          answers = typeof sub.internal_notes === 'string' ? JSON.parse(sub.internal_notes) : sub.internal_notes;
        } catch {
          answers = null;
        }
      }

      return {
        id: sub.id,
        form_id: form.id,
        form_title: form.title,
        customer_name: sub.customer_name || 'Anonymous Customer',
        customer_email: sub.customer_email,
        rating: sub.rating,
        summary_preview: sub.summary_preview || 'No comment provided.',
        review_status: sub.review_status,
        created_at: formatDate(sub.created_at),
        created_at_relative: diffForHumans(sub.created_at),
        answers,
      };
    });

    const submissionsPaginated = paginate({
      data,
      total,
      page,
      perPage,
      baseUrl: `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`,
    });

    res.status(200).json({
      form: {
        id: form.id,
        title: form.title,
        slug: form.slug,
        status: form.status,
      },
      submissions: submissionsPaginated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a customer response belonging to one of the authenticated user's forms
 */
async function destroyResponse(req, res, next) {
  try {
    const userId = req.user.id;
    const responseId = parseInt(req.params.id, 10);

    const rows = await db.query(
      `SELECT s.id, f.user_id 
       FROM feedback_submissions s
       JOIN feedback_forms f ON s.feedback_form_id = f.id
       WHERE s.id = ? LIMIT 1`,
      [responseId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Response not found.' });
    }

    if (rows[0].user_id !== userId) {
      return res.status(403).json({
        message: 'Unauthorized: You do not own the feedback form associated with this response.',
      });
    }

    await db.execute('DELETE FROM feedback_submissions WHERE id = ?', [responseId]);

    res.status(200).json({
      message: 'Response deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  stats,
  forms,
  storeForm,
  destroyForm,
  responses,
  showResponse,
  formResponses,
  destroyResponse,
};
