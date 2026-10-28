const db = require('../config/database');
const { paginate } = require('../utils/pagination');
const { formatDate, formatDateTime, diffForHumans } = require('../utils/responseHelper');

/**
 * Super Admin overview metrics and charts
 */
async function stats(req, res, next) {
  try {
    let days = parseInt(req.query.days || '30', 10);
    if (![7, 30, 90].includes(days)) {
      days = 30;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    const startDateStr = startDate.toISOString().slice(0, 19).replace('T', ' ');

    // Platform user stats
    const userStats = await db.query(
      `SELECT 
         COUNT(*) as total_users,
         SUM(CASE WHEN role = 'business' THEN 1 ELSE 0 END) as total_business_users,
         SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users
       FROM users`
    );

    const totalUsers = Number(userStats[0]?.total_users || 0);
    const totalBusinessUsers = Number(userStats[0]?.total_business_users || 0);
    const adminUsers = Number(userStats[0]?.admin_users || 0);

    // Form stats platform-wide
    const formStats = await db.query(
      `SELECT 
         COUNT(*) as total_forms,
         SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_forms,
         SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_forms
       FROM feedback_forms`
    );

    const totalForms = Number(formStats[0]?.total_forms || 0);
    const publishedForms = Number(formStats[0]?.published_forms || 0);
    const draftForms = Number(formStats[0]?.draft_forms || 0);

    // Submissions stats platform-wide
    const subStats = await db.query(
      `SELECT 
         COUNT(*) as total_responses,
         AVG(rating) as avg_rating,
         COUNT(rating) as total_rated_responses
       FROM feedback_submissions`
    );

    const totalResponses = Number(subStats[0]?.total_responses || 0);
    const avgRatingRaw = subStats[0]?.avg_rating;
    const averageRating = avgRatingRaw !== null && avgRatingRaw !== undefined ? Math.round(Number(avgRatingRaw) * 10) / 10 : null;
    const totalRatedResponses = Number(subStats[0]?.total_rated_responses || 0);

    // 1-5 Star Rating Distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const ratingsRows = await db.query(
      `SELECT rating, COUNT(*) as count 
       FROM feedback_submissions 
       WHERE rating IS NOT NULL 
       GROUP BY rating`
    );

    for (const row of ratingsRows) {
      const r = Number(row.rating);
      if (r >= 1 && r <= 5) {
        ratingDistribution[r] = Number(row.count);
      }
    }

    // Response activity timeline
    const timelineRows = await db.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM feedback_submissions 
       WHERE created_at >= ? 
       GROUP BY DATE(created_at)`,
      [startDateStr]
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

    // Recent users
    const recentUsersRows = await db.query(
      `SELECT 
         u.id, u.name, u.email, u.organization_name, u.role, u.created_at,
         COUNT(DISTINCT f.id) as forms_count,
         COUNT(DISTINCT s.id) as submissions_count
       FROM users u
       LEFT JOIN feedback_forms f ON f.user_id = u.id
       LEFT JOIN feedback_submissions s ON s.feedback_form_id = f.id
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT 5`
    );

    const recentUsers = recentUsersRows.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      organization_name: u.organization_name,
      role: u.role,
      forms_count: Number(u.forms_count || 0),
      submissions_count: Number(u.submissions_count || 0),
      created_at: formatDate(u.created_at),
    }));

    // Recent forms across all organizations
    const recentFormsRows = await db.query(
      `SELECT 
         f.id, f.title, f.slug, f.status, f.created_at,
         u.organization_name,
         COUNT(s.id) as submissions_count
       FROM feedback_forms f
       LEFT JOIN users u ON f.user_id = u.id
       LEFT JOIN feedback_submissions s ON s.feedback_form_id = f.id
       GROUP BY f.id
       ORDER BY f.created_at DESC
       LIMIT 5`
    );

    const recentForms = recentFormsRows.map(f => ({
      id: f.id,
      title: f.title,
      slug: f.slug,
      status: f.status,
      submissions_count: Number(f.submissions_count || 0),
      organization: f.organization_name || 'System',
      created_at: formatDate(f.created_at),
      share_url: `/f/${f.slug}`,
    }));

    // Recent responses platform-wide
    const recentResponsesRows = await db.query(
      `SELECT 
         s.id, s.customer_name, s.customer_email, s.rating, s.summary_preview, s.created_at,
         f.title as form_title,
         u.organization_name
       FROM feedback_submissions s
       LEFT JOIN feedback_forms f ON s.feedback_form_id = f.id
       LEFT JOIN users u ON f.user_id = u.id
       ORDER BY s.created_at DESC
       LIMIT 5`
    );

    const recentResponses = recentResponsesRows.map(sub => ({
      id: sub.id,
      customer_name: sub.customer_name || 'Anonymous Customer',
      customer_email: sub.customer_email,
      form_title: sub.form_title || 'Feedback Form',
      organization: sub.organization_name || 'Unknown',
      rating: sub.rating,
      summary_preview: sub.summary_preview || 'No comment provided.',
      created_at: formatDate(sub.created_at),
    }));

    res.status(200).json({
      metrics: {
        total_business_users: totalBusinessUsers,
        total_users: totalUsers,
        admin_users: adminUsers,
        total_forms: totalForms,
        published_forms: publishedForms,
        draft_forms: draftForms,
        total_responses: totalResponses,
        average_rating: averageRating,
        total_rated_responses: totalRatedResponses,
      },
      charts: {
        days,
        timeline,
        rating_distribution: ratingDistribution,
      },
      recent_users: recentUsers,
      recent_forms: recentForms,
      recent_responses: recentResponses,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List all platform users with counts and filters
 */
async function users(req, res, next) {
  try {
    const search = req.query.search ? req.query.search.trim() : '';
    const role = req.query.role ? req.query.role.trim() : '';
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const perPage = 15;
    const offset = (page - 1) * perPage;

    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push('(u.name LIKE ? OR u.email LIKE ? OR u.organization_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      whereConditions.push('u.role = ?');
      params.push(role);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      params
    );
    const total = Number(countResult[0]?.total || 0);

    const rows = await db.query(
      `SELECT 
         u.id, u.name, u.email, u.organization_name, u.role, u.created_at,
         COUNT(DISTINCT f.id) as forms_count,
         COUNT(DISTINCT s.id) as submissions_count
       FROM users u
       LEFT JOIN feedback_forms f ON f.user_id = u.id
       LEFT JOIN feedback_submissions s ON s.feedback_form_id = f.id
       ${whereClause}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, perPage, offset]
    );

    const data = rows.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      organization_name: u.organization_name,
      role: u.role,
      forms_count: Number(u.forms_count || 0),
      submissions_count: Number(u.submissions_count || 0),
      created_at: formatDate(u.created_at),
      created_at_relative: diffForHumans(u.created_at),
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
 * Top active users for admin quick navigation
 */
async function featuredUsers(req, res, next) {
  try {
    let limit = parseInt(req.query.limit || '5', 10);
    if (limit < 1 || limit > 20) limit = 5;

    const countResult = await db.query('SELECT COUNT(*) as total FROM users');
    const totalUsers = Number(countResult[0]?.total || 0);

    const rows = await db.query(
      `SELECT 
         u.id, u.name, u.email, u.organization_name, u.role, u.created_at,
         COUNT(DISTINCT f.id) as forms_count,
         COUNT(DISTINCT s.id) as submissions_count
       FROM users u
       LEFT JOIN feedback_forms f ON f.user_id = u.id
       LEFT JOIN feedback_submissions s ON s.feedback_form_id = f.id
       GROUP BY u.id
       ORDER BY submissions_count DESC, forms_count DESC, u.created_at DESC
       LIMIT ?`,
      [limit]
    );

    const featuredUsersList = rows.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      organization_name: u.organization_name,
      role: u.role,
      forms_count: Number(u.forms_count || 0),
      submissions_count: Number(u.submissions_count || 0),
      created_at: formatDate(u.created_at),
    }));

    res.status(200).json({
      featured_users: featuredUsersList,
      total_users: totalUsers,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Full user details drilldown
 */
async function showUser(req, res, next) {
  try {
    const targetUserId = parseInt(req.params.id, 10);

    const users = await db.query('SELECT * FROM users WHERE id = ? LIMIT 1', [targetUserId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const user = users[0];

    // User's forms
    const formsRows = await db.query(
      `SELECT 
         f.id, f.user_id, f.title, f.description, f.slug, f.status, f.created_at,
         COUNT(s.id) as submissions_count,
         AVG(s.rating) as avg_rating,
         MAX(s.created_at) as last_response_at
       FROM feedback_forms f
       LEFT JOIN feedback_submissions s ON s.feedback_form_id = f.id
       WHERE f.user_id = ?
       GROUP BY f.id
       ORDER BY f.created_at DESC`,
      [targetUserId]
    );

    const forms = formsRows.map(f => {
      const avg = f.avg_rating !== null && f.avg_rating !== undefined ? Math.round(Number(f.avg_rating) * 10) / 10 : null;
      return {
        id: f.id,
        user_id: f.user_id,
        title: f.title,
        description: f.description,
        slug: f.slug,
        status: f.status,
        submissions_count: Number(f.submissions_count || 0),
        average_rating: avg,
        created_at: formatDate(f.created_at),
        created_at_relative: diffForHumans(f.created_at),
        last_response_at: f.last_response_at ? formatDate(f.last_response_at) : null,
        share_url: `/f/${f.slug}`,
      };
    });

    // Submissions received across this user's forms
    const submissionStats = await db.query(
      `SELECT 
         COUNT(s.id) as total_responses,
         AVG(s.rating) as avg_rating,
         COUNT(s.rating) as total_rated_responses
       FROM feedback_submissions s
       JOIN feedback_forms f ON s.feedback_form_id = f.id
       WHERE f.user_id = ?`,
      [targetUserId]
    );

    const totalResponses = Number(submissionStats[0]?.total_responses || 0);
    const avgRatingVal = submissionStats[0]?.avg_rating;
    const averageRating = avgRatingVal !== null && avgRatingVal !== undefined ? Math.round(Number(avgRatingVal) * 10) / 10 : null;
    const totalRatedResponses = Number(submissionStats[0]?.total_rated_responses || 0);

    // 1-5 Star Rating Distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const ratingsRows = await db.query(
      `SELECT s.rating, COUNT(*) as count 
       FROM feedback_submissions s
       JOIN feedback_forms f ON s.feedback_form_id = f.id
       WHERE f.user_id = ? AND s.rating IS NOT NULL
       GROUP BY s.rating`,
      [targetUserId]
    );

    for (const r of ratingsRows) {
      const ratingNum = Number(r.rating);
      if (ratingNum >= 1 && ratingNum <= 5) {
        ratingDistribution[ratingNum] = Number(r.count);
      }
    }

    // List of responses
    const responsesRows = await db.query(
      `SELECT 
         s.id, s.feedback_form_id, s.customer_name, s.customer_email, s.rating,
         s.summary_preview, s.review_status, s.internal_notes, s.created_at,
         f.title as form_title, f.slug as form_slug
       FROM feedback_submissions s
       JOIN feedback_forms f ON s.feedback_form_id = f.id
       WHERE f.user_id = ?
       ORDER BY s.created_at DESC`,
      [targetUserId]
    );

    const responses = responsesRows.map(sub => {
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
        feedback_form_id: sub.feedback_form_id,
        form_title: sub.form_title || 'Feedback Form',
        form_slug: sub.form_slug,
        customer_name: sub.customer_name || 'Anonymous Customer',
        customer_email: sub.customer_email,
        rating: sub.rating,
        summary_preview: sub.summary_preview || 'No comment provided.',
        review_status: sub.review_status,
        created_at: formatDateTime(sub.created_at),
        created_at_relative: diffForHumans(sub.created_at),
        answers,
      };
    });

    const publishedFormsCount = forms.filter(f => f.status === 'published').length;
    const draftFormsCount = forms.filter(f => f.status === 'draft').length;

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organization_name: user.organization_name,
        role: user.role,
        forms_count: forms.length,
        submissions_count: totalResponses,
        average_rating: averageRating,
        created_at: formatDate(user.created_at),
        created_at_relative: diffForHumans(user.created_at),
      },
      metrics: {
        total_forms: forms.length,
        published_forms: publishedFormsCount,
        draft_forms: draftFormsCount,
        total_responses: totalResponses,
        average_rating: averageRating,
        total_rated_responses: totalRatedResponses,
        rating_distribution: ratingDistribution,
      },
      forms,
      responses,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user role
 */
async function updateUserRole(req, res, next) {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { role } = req.body;
    const roleToSet = role === 'user' ? 'business' : role;

    const users = await db.query('SELECT * FROM users WHERE id = ? LIMIT 1', [targetUserId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const targetUser = users[0];

    // Safety: If demoting self, make sure another admin exists
    if (targetUser.id === req.user.id && roleToSet !== 'admin') {
      const otherAdmins = await db.query(
        'SELECT COUNT(*) as count FROM users WHERE role = ? AND id != ?',
        ['admin', targetUser.id]
      );
      if (Number(otherAdmins[0]?.count || 0) === 0) {
        return res.status(422).json({
          message: 'Cannot revoke your own admin rights because you are the only administrator.',
        });
      }
    }

    await db.execute('UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?', [roleToSet, targetUser.id]);

    res.status(200).json({
      message: `User role updated to ${roleToSet} successfully.`,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        organization_name: targetUser.organization_name,
        role: roleToSet,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete user and cascade all feedback data
 */
async function deleteUser(req, res, next) {
  try {
    const targetUserId = parseInt(req.params.id, 10);

    if (req.user.id === targetUserId) {
      return res.status(422).json({
        message: 'You cannot delete your own administrator account.',
      });
    }

    const users = await db.query('SELECT id FROM users WHERE id = ? LIMIT 1', [targetUserId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Cascade delete in transaction
    await db.transaction(async (conn) => {
      // Find user's forms
      const [forms] = await conn.execute('SELECT id FROM feedback_forms WHERE user_id = ?', [targetUserId]);
      const formIds = forms.map(f => f.id);

      if (formIds.length > 0) {
        const placeholders = formIds.map(() => '?').join(',');
        await conn.execute(`DELETE FROM feedback_submissions WHERE feedback_form_id IN (${placeholders})`, formIds);
        await conn.execute(`DELETE FROM feedback_forms WHERE id IN (${placeholders})`, formIds);
      }

      await conn.execute('DELETE FROM users WHERE id = ?', [targetUserId]);
    });

    res.status(200).json({
      message: 'User and all associated feedback data deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List all platform forms across all tenants
 */
async function forms(req, res, next) {
  try {
    const search = req.query.search ? req.query.search.trim() : '';
    const status = req.query.status ? req.query.status.trim() : '';
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const perPage = 15;
    const offset = (page - 1) * perPage;

    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push('(f.title LIKE ? OR f.slug LIKE ? OR u.name LIKE ? OR u.organization_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      whereConditions.push('f.status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) as total 
       FROM feedback_forms f 
       LEFT JOIN users u ON f.user_id = u.id 
       ${whereClause}`,
      params
    );
    const total = Number(countResult[0]?.total || 0);

    const rows = await db.query(
      `SELECT 
         f.id, f.user_id, f.title, f.description, f.slug, f.status, f.created_at,
         u.name as owner_name, u.email as owner_email, u.organization_name,
         COUNT(s.id) as submissions_count,
         AVG(s.rating) as avg_rating,
         MAX(s.created_at) as last_response_at
       FROM feedback_forms f
       LEFT JOIN users u ON f.user_id = u.id
       LEFT JOIN feedback_submissions s ON s.feedback_form_id = f.id
       ${whereClause}
       GROUP BY f.id
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, perPage, offset]
    );

    const data = rows.map(f => {
      const avg = f.avg_rating !== null && f.avg_rating !== undefined ? Math.round(Number(f.avg_rating) * 10) / 10 : null;
      return {
        id: f.id,
        user_id: f.user_id,
        title: f.title,
        description: f.description,
        slug: f.slug,
        status: f.status,
        organization_name: f.organization_name || 'System',
        owner_name: f.owner_name || 'Unknown',
        owner_email: f.owner_email,
        submissions_count: Number(f.submissions_count || 0),
        average_rating: avg,
        created_at: formatDate(f.created_at),
        last_response_at: f.last_response_at ? formatDate(f.last_response_at) : null,
        share_url: `/f/${f.slug}`,
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
 * Superadmin form deletion
 */
async function destroyForm(req, res, next) {
  try {
    const formId = parseInt(req.params.id, 10);
    const forms = await db.query('SELECT id FROM feedback_forms WHERE id = ? LIMIT 1', [formId]);
    if (forms.length === 0) {
      return res.status(404).json({ message: 'Feedback form not found.' });
    }

    await db.execute('DELETE FROM feedback_forms WHERE id = ?', [formId]);

    res.status(200).json({
      message: 'Feedback form and all associated responses deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List all customer submissions platform-wide with filters
 */
async function responses(req, res, next) {
  try {
    const rating = req.query.rating ? parseInt(req.query.rating, 10) : null;
    const formId = req.query.form_id ? parseInt(req.query.form_id, 10) : null;
    const search = req.query.search ? req.query.search.trim() : '';
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const perPage = 15;
    const offset = (page - 1) * perPage;

    let whereConditions = [];
    let params = [];

    if (rating) {
      whereConditions.push('s.rating = ?');
      params.push(rating);
    }

    if (formId) {
      whereConditions.push('s.feedback_form_id = ?');
      params.push(formId);
    }

    if (search) {
      whereConditions.push('(s.customer_name LIKE ? OR s.customer_email LIKE ? OR s.summary_preview LIKE ? OR f.title LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) as total 
       FROM feedback_submissions s
       LEFT JOIN feedback_forms f ON s.feedback_form_id = f.id
       ${whereClause}`,
      params
    );
    const total = Number(countResult[0]?.total || 0);

    const rows = await db.query(
      `SELECT 
         s.id, s.feedback_form_id, s.customer_name, s.customer_email, s.rating,
         s.summary_preview, s.review_status, s.internal_notes, s.created_at,
         f.title as form_title, f.slug as form_slug, f.user_id,
         u.name as owner_name, u.organization_name
       FROM feedback_submissions s
       LEFT JOIN feedback_forms f ON s.feedback_form_id = f.id
       LEFT JOIN users u ON f.user_id = u.id
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
        user_id: sub.user_id,
        owner_name: sub.owner_name || 'Unknown',
        form_title: sub.form_title || 'Feedback Form',
        form_slug: sub.form_slug,
        organization_name: sub.organization_name || 'Platform',
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
 * Superadmin response deletion
 */
async function destroyResponse(req, res, next) {
  try {
    const responseId = parseInt(req.params.id, 10);
    const submissions = await db.query('SELECT id FROM feedback_submissions WHERE id = ? LIMIT 1', [responseId]);
    if (submissions.length === 0) {
      return res.status(404).json({ message: 'Response not found.' });
    }

    await db.execute('DELETE FROM feedback_submissions WHERE id = ?', [responseId]);

    res.status(200).json({
      message: 'Response deleted successfully by administrator.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  stats,
  users,
  featuredUsers,
  showUser,
  updateUserRole,
  deleteUser,
  forms,
  destroyForm,
  responses,
  destroyResponse,
};
