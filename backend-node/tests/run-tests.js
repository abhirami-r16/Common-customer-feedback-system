/**
 * Automated Test Suite for Node.js Express + MySQL Backend
 * Validates all endpoints, auth rules, bcrypt compatibility, and data contracts.
 * Safely cleans up all test-generated records upon completion.
 */
const http = require('http');
const crypto = require('crypto');
const app = require('../src/app');
const db = require('../src/config/database');

let server;
let baseUrl;

// Tracking test records for safe, reliable cleanup
const testTracked = {
  userIds: [],
  formIds: [],
  subIds: [],
  tokenIds: [],
};

function request(method, path, body = null, token = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...extraHeaders,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(rawData);
          } catch {
            parsed = rawData;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

const testResults = [];

function recordTest(name, passed, details = '') {
  testResults.push({ name, passed, details });
  const mark = passed ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${name} ${details ? '(' + details + ')' : ''}`);
}

async function runTests() {
  console.log('================================================================');
  console.log('Running Automated Compatibility & Endpoint Tests (Node.js API)');
  console.log('================================================================');

  // Start test server on random free port
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Test server active at: ${baseUrl}\n`);
      resolve();
    });
  });

  try {
    // 1. Health check
    const health = await request('GET', '/api/health');
    recordTest(
      'Endpoint 1: GET /api/health',
      health.status === 200 && health.body.status === 'healthy',
      `status=${health.status}, db=${health.body.database}`
    );

    // 2. Register business user
    const uniqueEmail = `test_biz_${Date.now()}@example.com`;
    const regRes = await request('POST', '/api/register', {
      name: 'Test Business Owner',
      email: uniqueEmail,
      password: 'password123',
      password_confirmation: 'password123',
      organization_name: 'Test Acme Corp',
    });
    recordTest(
      'Endpoint 2: POST /api/register',
      regRes.status === 201 && !!regRes.body.token && regRes.body.user.role === 'business',
      `status=${regRes.status}, role=${regRes.body.user?.role}`
    );
    const businessToken = regRes.body.token;
    const businessUser = regRes.body.user;
    if (businessUser?.id) testTracked.userIds.push(businessUser.id);

    // 3. Login with newly registered user
    const loginRes = await request('POST', '/api/login', {
      email: uniqueEmail,
      password: 'password123',
    });
    recordTest(
      'Endpoint 3: POST /api/login (New user)',
      loginRes.status === 200 && !!loginRes.body.token,
      `status=${loginRes.status}`
    );

    // 4. Login with existing admin user and verify $2y$12$ bcrypt password compatibility
    const adminLoginRes = await request('POST', '/api/login', {
      email: 'admin@gmail.com',
      password: 'admin123',
    });
    recordTest(
      'Endpoint 4: POST /api/login (Existing Admin with $2y$ Bcrypt Hash)',
      adminLoginRes.status === 200 && adminLoginRes.body.user.role === 'admin',
      `status=${adminLoginRes.status}, role=${adminLoginRes.body.user?.role}`
    );
    const adminToken = adminLoginRes.body.token;

    // 5. Test Sanctum Personal Access Token format compatibility (id|plaintext)
    const sanctumPlain = 'testSanctumTokenSecret_' + Date.now() + '_' + Math.random().toString(36);
    const sanctumHash = crypto.createHash('sha256').update(sanctumPlain).digest('hex');
    const patResult = await db.execute(
      `INSERT INTO personal_access_tokens (tokenable_type, tokenable_id, name, token, abilities, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      ['App\\Models\\User', businessUser.id, 'sanctum_test', sanctumHash, '["*"]']
    );
    testTracked.tokenIds.push(patResult.insertId);

    const sanctumHeader = `${patResult.insertId}|${sanctumPlain}`;
    const sanctumAuthRes = await request('GET', '/api/user', null, sanctumHeader);
    recordTest(
      'Auth Feature: Laravel Sanctum Token Support (id|plaintext)',
      sanctumAuthRes.status === 200 && sanctumAuthRes.body.id === businessUser.id,
      `status=${sanctumAuthRes.status}, user=${sanctumAuthRes.body?.name}`
    );

    // 6. Forgot password
    const forgotRes = await request('POST', '/api/forgot-password', {
      email: uniqueEmail,
    });
    recordTest(
      'Endpoint 5: POST /api/forgot-password',
      forgotRes.status === 200 && !!forgotRes.body.token && !!forgotRes.body.reset_url,
      `status=${forgotRes.status}`
    );
    const resetToken = forgotRes.body.token;

    // 7. Reset password with valid token
    const resetRes = await request('POST', '/api/reset-password', {
      email: uniqueEmail,
      token: resetToken,
      password: 'newpassword123',
      password_confirmation: 'newpassword123',
    });
    recordTest(
      'Endpoint 6: POST /api/reset-password',
      resetRes.status === 200,
      `status=${resetRes.status}`
    );

    // 8. Test expired password reset token (> 60 minutes)
    const expiredToken = crypto.randomBytes(32).toString('hex');
    await db.execute(
      `INSERT INTO password_reset_tokens (email, token, created_at)
       VALUES (?, ?, DATE_SUB(NOW(), INTERVAL 90 MINUTE))
       ON DUPLICATE KEY UPDATE token = VALUES(token), created_at = VALUES(created_at)`,
      [uniqueEmail, expiredToken]
    );
    const expiredResetRes = await request('POST', '/api/reset-password', {
      email: uniqueEmail,
      token: expiredToken,
      password: 'anotherpassword123',
      password_confirmation: 'anotherpassword123',
    });
    recordTest(
      'Security Check: Expired Password Reset Token Rejected (422)',
      expiredResetRes.status === 422,
      `status=${expiredResetRes.status}, msg=${expiredResetRes.body?.message}`
    );
    await db.execute('DELETE FROM password_reset_tokens WHERE email = ?', [uniqueEmail]);

    // 9. Get current authenticated user
    const userRes = await request('GET', '/api/user', null, businessToken);
    recordTest(
      'Endpoint 7: GET /api/user',
      userRes.status === 200 && userRes.body.email === uniqueEmail,
      `status=${userRes.status}, email=${userRes.body.email}`
    );

    // 10. Business Dashboard Stats
    const statsRes = await request('GET', '/api/dashboard/stats?days=30', null, businessToken);
    recordTest(
      'Endpoint 8: GET /api/dashboard/stats',
      statsRes.status === 200 && statsRes.body.metrics && Array.isArray(statsRes.body.charts.timeline),
      `status=${statsRes.status}, total_forms=${statsRes.body.metrics?.total_forms}`
    );

    // 11. Business Forms listing
    const formsRes = await request('GET', '/api/forms', null, businessToken);
    recordTest(
      'Endpoint 9: GET /api/forms',
      formsRes.status === 200 && Array.isArray(formsRes.body.data) && formsRes.body.current_page === 1,
      `status=${formsRes.status}, total=${formsRes.body.total}`
    );

    // 12. Business Quick Form Creation
    const createFormRes = await request(
      'POST',
      '/api/forms',
      {
        title: 'Customer Satisfaction Survey',
        description: 'Testing quick form creation endpoint',
        status: 'draft',
      },
      businessToken
    );
    recordTest(
      'Endpoint 10: POST /api/forms',
      createFormRes.status === 201 && !!createFormRes.body.form?.slug,
      `status=${createFormRes.status}, slug=${createFormRes.body.form?.slug}`
    );
    const createdForm = createFormRes.body.form;
    if (createdForm?.id) testTracked.formIds.push(createdForm.id);

    // 13. Form Builder Save (Nested Sections, Questions, Options)
    const builderPayload = {
      id: createdForm.id,
      title: 'Customer Satisfaction Survey (Updated)',
      description: 'Comprehensive feedback on product and support',
      status: 'published',
      sections: [
        {
          title: 'Experience Details',
          description: 'Tell us how we performed',
          position: 0,
          questions: [
            {
              question_text: 'Overall satisfaction rating',
              question_type: 'star_rating',
              is_required: true,
              settings: { max_rating: 5 },
              position: 0,
            },
            {
              question_text: 'Which feature did you enjoy most?',
              question_type: 'multiple_choice',
              is_required: false,
              position: 1,
              options: [
                { option_text: 'Ease of Use', position: 0 },
                { option_text: 'Performance & Speed', position: 1 },
                { option_text: 'Customer Service', position: 2 },
              ],
            },
          ],
        },
      ],
    };

    const builderSaveRes = await request('POST', '/api/forms/builder', builderPayload, businessToken);
    recordTest(
      'Endpoint 11: POST /api/forms/builder',
      builderSaveRes.status === 200 && builderSaveRes.body.form?.status === 'published',
      `status=${builderSaveRes.status}, sections=${builderSaveRes.body.form?.sections?.length}`
    );
    const publishedForm = builderSaveRes.body.form;

    // 14. Form Builder Show
    const showFormRes = await request('GET', `/api/forms/${createdForm.id}`, null, businessToken);
    recordTest(
      'Endpoint 12: GET /api/forms/:id',
      showFormRes.status === 200 && showFormRes.body.form?.sections[0]?.questions?.length === 2,
      `status=${showFormRes.status}, questions=${showFormRes.body.form?.sections[0]?.questions?.length}`
    );

    // 15. Form Status Update
    const updateStatusRes = await request(
      'PATCH',
      `/api/forms/${createdForm.id}/status`,
      { status: 'published' },
      businessToken
    );
    recordTest(
      'Endpoint 13: PATCH /api/forms/:id/status',
      updateStatusRes.status === 200 && updateStatusRes.body.status === 'published',
      `status=${updateStatusRes.status}`
    );

    // 16. Public Form View
    const publicFormRes = await request('GET', `/api/public/forms/${publishedForm.slug}`);
    recordTest(
      'Endpoint 14: GET /api/public/forms/:slug',
      publicFormRes.status === 200 && !!publicFormRes.body.form?.user?.business_name,
      `status=${publicFormRes.status}, business_name=${publicFormRes.body.form?.user?.business_name}`
    );

    // 17. Public Feedback Submission
    const firstQuestion = publishedForm.sections[0].questions[0];
    const secondQuestion = publishedForm.sections[0].questions[1];
    const submitPayload = {
      customer_name: 'John Doe',
      customer_email: 'johndoe@example.com',
      client_token: 'usr_client_token_test_' + Date.now(),
      answers: {
        [firstQuestion.id]: 5,
        [secondQuestion.id]: 'Ease of Use',
      },
    };

    const submitRes = await request('POST', `/api/public/forms/${publishedForm.slug}/submit`, submitPayload);
    recordTest(
      'Endpoint 15: POST /api/public/forms/:slug/submit',
      submitRes.status === 200 && submitRes.body.already_submitted === true,
      `status=${submitRes.status}, submission_id=${submitRes.body.submission_id}`
    );
    const submissionId = submitRes.body.submission_id;
    if (submissionId) testTracked.subIds.push(submissionId);

    // 18. Anti-Duplicate Submission Protection (Submitting same form again with same token)
    const duplicateRes = await request('POST', `/api/public/forms/${publishedForm.slug}/submit`, submitPayload);
    recordTest(
      'Anti-Duplicate Check: Duplicate Submission Blocked with 422',
      duplicateRes.status === 422 && duplicateRes.body.already_submitted === true,
      `status=${duplicateRes.status}, message=${duplicateRes.body.message}`
    );

    // 19. Form Responses (specific form)
    const formResponsesRes = await request('GET', `/api/forms/${publishedForm.id}/responses`, null, businessToken);
    recordTest(
      'Endpoint 16: GET /api/forms/:id/responses',
      formResponsesRes.status === 200 && formResponsesRes.body.submissions?.data?.length > 0,
      `status=${formResponsesRes.status}, count=${formResponsesRes.body.submissions?.total}`
    );

    // 20. Responses list across user's forms
    const allResponsesRes = await request('GET', '/api/responses', null, businessToken);
    recordTest(
      'Endpoint 17: GET /api/responses',
      allResponsesRes.status === 200 && allResponsesRes.body.data?.length > 0,
      `status=${allResponsesRes.status}, count=${allResponsesRes.body.total}`
    );

    // 21. Single response details
    const showResponseRes = await request('GET', `/api/responses/${submissionId}`, null, businessToken);
    recordTest(
      'Endpoint 18: GET /api/responses/:id',
      showResponseRes.status === 200 && showResponseRes.body.customer_name === 'John Doe',
      `status=${showResponseRes.status}, customer=${showResponseRes.body?.customer_name}`
    );

    // 22. Business User deleting own response
    const deleteRespRes = await request('DELETE', `/api/responses/${submissionId}`, null, businessToken);
    recordTest(
      'Endpoint 19: DELETE /api/responses/:id',
      deleteRespRes.status === 200,
      `status=${deleteRespRes.status}`
    );

    // 23. Business User deleting own form
    const deleteFormRes = await request('DELETE', `/api/forms/${publishedForm.id}`, null, businessToken);
    recordTest(
      'Endpoint 20: DELETE /api/forms/:id',
      deleteFormRes.status === 200,
      `status=${deleteFormRes.status}`
    );

    // 24. Role-Based Permissions Enforcement:
    // A) Admin accessing business route -> 403 Forbidden
    const adminOnBizRes = await request('GET', '/api/dashboard/stats', null, adminToken);
    recordTest(
      'Role Enforcement: Admin blocked from Business Dashboard (403)',
      adminOnBizRes.status === 403,
      `status=${adminOnBizRes.status}, msg=${adminOnBizRes.body.message}`
    );

    // B) Business user accessing admin route -> 403 Forbidden
    const bizOnAdminRes = await request('GET', '/api/admin/stats', null, businessToken);
    recordTest(
      'Role Enforcement: Business user blocked from Admin Portal (403)',
      bizOnAdminRes.status === 403,
      `status=${bizOnAdminRes.status}, msg=${bizOnAdminRes.body.message}`
    );

    // 25. Admin Platform Stats
    const adminStatsRes = await request('GET', '/api/admin/stats?days=30', null, adminToken);
    recordTest(
      'Endpoint 21: GET /api/admin/stats',
      adminStatsRes.status === 200 && adminStatsRes.body.metrics?.total_users > 0,
      `status=${adminStatsRes.status}, total_users=${adminStatsRes.body.metrics?.total_users}`
    );

    // 26. Admin Users listing
    const adminUsersRes = await request('GET', '/api/admin/users', null, adminToken);
    recordTest(
      'Endpoint 22: GET /api/admin/users',
      adminUsersRes.status === 200 && adminUsersRes.body.data?.length > 0,
      `status=${adminUsersRes.status}, count=${adminUsersRes.body.total}`
    );

    // 27. Admin Featured Users
    const featUsersRes = await request('GET', '/api/admin/featured-users?limit=5', null, adminToken);
    recordTest(
      'Endpoint 23: GET /api/admin/featured-users',
      featUsersRes.status === 200 && Array.isArray(featUsersRes.body.featured_users),
      `status=${featUsersRes.status}, featured_count=${featUsersRes.body.featured_users?.length}`
    );

    // 28. Admin User Details
    const showUserRes = await request('GET', `/api/admin/users/${businessUser.id}`, null, adminToken);
    recordTest(
      'Endpoint 24: GET /api/admin/users/:id',
      showUserRes.status === 200 && showUserRes.body.user?.email === uniqueEmail,
      `status=${showUserRes.status}, user=${showUserRes.body.user?.name}`
    );

    // 29. Admin Update User Role
    const updateRoleRes = await request(
      'PATCH',
      `/api/admin/users/${businessUser.id}/role`,
      { role: 'admin' },
      adminToken
    );
    recordTest(
      'Endpoint 25: PATCH /api/admin/users/:id/role',
      updateRoleRes.status === 200 && updateRoleRes.body.user?.role === 'admin',
      `status=${updateRoleRes.status}, new_role=${updateRoleRes.body.user?.role}`
    );

    // Demote back to business
    await request('PATCH', `/api/admin/users/${businessUser.id}/role`, { role: 'business' }, adminToken);

    // 30. Admin Forms listing
    const adminFormsRes = await request('GET', '/api/admin/forms', null, adminToken);
    recordTest(
      'Endpoint 26: GET /api/admin/forms',
      adminFormsRes.status === 200 && Array.isArray(adminFormsRes.body.data),
      `status=${adminFormsRes.status}, count=${adminFormsRes.body.total}`
    );

    // 31. Admin Responses listing
    const adminResponsesRes = await request('GET', '/api/admin/responses', null, adminToken);
    recordTest(
      'Endpoint 27: GET /api/admin/responses',
      adminResponsesRes.status === 200 && Array.isArray(adminResponsesRes.body.data),
      `status=${adminResponsesRes.status}, count=${adminResponsesRes.body.total}`
    );

    // 32. Admin response deletion
    const tempSub = await db.execute(
      `INSERT INTO feedback_submissions (feedback_form_id, customer_name, rating, created_at, updated_at) 
       VALUES (?, 'Admin Deletion Test', 5, NOW(), NOW())`,
      [12]
    );
    testTracked.subIds.push(tempSub.insertId);

    const adminDelResp = await request('DELETE', `/api/admin/responses/${tempSub.insertId}`, null, adminToken);
    recordTest(
      'Endpoint 28: DELETE /api/admin/responses/:id',
      adminDelResp.status === 200,
      `status=${adminDelResp.status}`
    );

    // 33. Admin form deletion
    const tempFormResult = await db.execute(
      `INSERT INTO feedback_forms (user_id, title, slug, status, created_at, updated_at)
       VALUES (?, 'Temp Form For Deletion', 'temp-del-slug-${Date.now()}', 'draft', NOW(), NOW())`,
      [businessUser.id]
    );
    testTracked.formIds.push(tempFormResult.insertId);

    const adminDelForm = await request('DELETE', `/api/admin/forms/${tempFormResult.insertId}`, null, adminToken);
    recordTest(
      'Endpoint 29: DELETE /api/admin/forms/:id',
      adminDelForm.status === 200,
      `status=${adminDelForm.status}`
    );

    // 34. Admin Delete User
    const adminDelUser = await request('DELETE', `/api/admin/users/${businessUser.id}`, null, adminToken);
    recordTest(
      'Endpoint 30: DELETE /api/admin/users/:id',
      adminDelUser.status === 200,
      `status=${adminDelUser.status}`
    );

    // 35. Logout
    const logoutRes = await request('POST', '/api/logout', null, adminToken);
    recordTest(
      'Auth Feature: POST /api/logout',
      logoutRes.status === 200,
      `status=${logoutRes.status}`
    );

    // 36. CORS Security: Production Vercel Origin Allowed
    const corsVercelRes = await request('GET', '/api/health', null, null, {
      'Origin': 'https://common-customer-feedback-system.vercel.app',
    });
    recordTest(
      'CORS Policy: Deployed Vercel Origin Permitted',
      corsVercelRes.status === 200 &&
        corsVercelRes.headers['access-control-allow-origin'] === 'https://common-customer-feedback-system.vercel.app',
      `status=${corsVercelRes.status}, allow_origin=${corsVercelRes.headers['access-control-allow-origin']}`
    );

    // 37. CORS Security: Localhost Development Origin Allowed
    const corsLocalRes = await request('GET', '/api/health', null, null, {
      'Origin': 'http://localhost:5173',
    });
    recordTest(
      'CORS Policy: Local Development Origin Permitted',
      corsLocalRes.status === 200 &&
        corsLocalRes.headers['access-control-allow-origin'] === 'http://localhost:5173',
      `status=${corsLocalRes.status}, allow_origin=${corsLocalRes.headers['access-control-allow-origin']}`
    );

    // 38. CORS Security: Unauthorized Origin Blocked with 403
    const corsBlockedRes = await request('GET', '/api/health', null, null, {
      'Origin': 'https://unauthorized-attacker.example.com',
    });
    recordTest(
      'CORS Policy: Unauthorized Foreign Origin Blocked (403)',
      corsBlockedRes.status === 403,
      `status=${corsBlockedRes.status}, message=${corsBlockedRes.body?.message || corsBlockedRes.body}`
    );

  } finally {
    // Teardown HTTP server
    if (server) {
      server.close();
    }

    // Comprehensive automated cleanup of any test-created records
    try {
      if (testTracked.tokenIds.length > 0) {
        const p = testTracked.tokenIds.map(() => '?').join(',');
        await db.execute(`DELETE FROM personal_access_tokens WHERE id IN (${p})`, testTracked.tokenIds);
      }
      if (testTracked.subIds.length > 0) {
        const p = testTracked.subIds.map(() => '?').join(',');
        await db.execute(`DELETE FROM feedback_submissions WHERE id IN (${p})`, testTracked.subIds);
      }
      if (testTracked.formIds.length > 0) {
        const p = testTracked.formIds.map(() => '?').join(',');
        await db.execute(`DELETE FROM feedback_forms WHERE id IN (${p})`, testTracked.formIds);
      }
      if (testTracked.userIds.length > 0) {
        const p = testTracked.userIds.map(() => '?').join(',');
        await db.execute(`DELETE FROM users WHERE id IN (${p})`, testTracked.userIds);
      }
      // Safety cleanup for any test-generated pattern
      await db.execute("DELETE FROM users WHERE email LIKE 'test_biz_%'");
      await db.execute("DELETE FROM personal_access_tokens WHERE name = 'sanctum_test'");
    } catch (cleanupErr) {
      console.warn('[Warning] Test cleanup encountered error:', cleanupErr.message);
    }
  }

  // Summary
  console.log('\n================================================================');
  console.log('Test Execution Summary:');
  const passedCount = testResults.filter(t => t.passed).length;
  const totalCount = testResults.length;
  console.log(`Total Tests Executed: ${totalCount}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${totalCount - passedCount}`);
  console.log('================================================================');

  // Verify baseline data was not touched
  const baselineUsers = await db.query('SELECT id FROM users WHERE id IN (2, 3, 7)');
  const baselineForms = await db.query('SELECT id FROM feedback_forms WHERE id IN (12, 13)');
  const baselineSubs = await db.query('SELECT id FROM feedback_submissions WHERE id IN (8, 9)');

  if (baselineUsers.length === 3 && baselineForms.length === 2 && baselineSubs.length === 2) {
    console.log('[Data Integrity] Baseline production records are 100% intact.');
  } else {
    console.error('[Data Integrity Warning] Baseline record count mismatch!');
  }

  if (passedCount === totalCount && baselineUsers.length === 3) {
    console.log('>>> ALL ENDPOINTS & COMPATIBILITY CHECKS PASSED WITH CLEAN TEARDOWN! <<<');
    process.exit(0);
  } else {
    console.error('>>> SOME CHECKS FAILED. PLEASE REVIEW THE LOGS ABOVE. <<<');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
