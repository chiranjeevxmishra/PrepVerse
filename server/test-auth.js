/**
 * Automated Verification Script for Phase 1 Authentication
 * Tests:
 * 1. Unauthenticated request to /api/v1/auth/me (should fail with 401)
 * 2. Student Registration /api/v1/auth/register (should succeed with 201 + token)
 * 3. Authenticated request to /api/v1/auth/me (should succeed with 200 + user profile)
 * 4. Invalid credentials /api/v1/auth/login (should fail with 401)
 * 5. Valid login /api/v1/auth/login (should succeed with 200)
 * 6. Bogus/invalid token to /api/v1/auth/me (should fail with 401)
 * 7. Google OAuth /api/v1/auth/google (should succeed with 200)
 * 8. Logout /api/v1/auth/logout (should succeed with 200)
 */

import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { ENV } from './src/config/env.js';

let server;

const runTests = async () => {
  console.log('=== STARTING PHASE 1 AUTHENTICATION TESTS ===\n');
  await connectDB();

  server = app.listen(5001, async () => {
    const BASE_URL = 'http://127.0.0.1:5001/api/v1/auth';
    let passed = 0;
    let failed = 0;

    const assert = (condition, name) => {
      if (condition) {
        console.log(`✅ [PASS] ${name}`);
        passed++;
      } else {
        console.error(`❌ [FAIL] ${name}`);
        failed++;
      }
    };

    try {
      // 1. Unauthenticated request
      console.log('--- Test 1: Unauthenticated Access ---');
      const unauthRes = await fetch(`${BASE_URL}/me`);
      const unauthData = await unauthRes.json();
      assert(unauthRes.status === 401, 'Unauthenticated GET /me returns 401');
      assert(unauthData.success === false, 'Unauthenticated response has success: false');

      // 2. Student Registration
      console.log('\n--- Test 2: Student Registration ---');
      const testEmail = `student_${Date.now()}@prepverse.dev`;
      const regRes = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Priya Sharma',
          email: testEmail,
          password: 'securePassword123',
        }),
      });
      const regData = await regRes.json();
      assert(regRes.status === 201, 'POST /register returns 201 Created');
      assert(regData.user.email === testEmail, 'Registered user has correct email');
      assert(!!regData.token, 'Registration returns valid JWT token');

      const authToken = regData.token;

      // 3. Authenticated request using Bearer Token
      console.log('\n--- Test 3: Authenticated Access with Token ---');
      const authRes = await fetch(`${BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const authData = await authRes.json();
      assert(authRes.status === 200, 'Authenticated GET /me returns 200 OK');
      assert(authData.user.name === 'Priya Sharma', 'Authenticated profile contains user name');
      assert(authData.user.role === 'student', 'User role defaults to student');

      // 4. Invalid Login (wrong password)
      console.log('\n--- Test 4: Invalid Authentication ---');
      const badLoginRes = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'wrongPassword!#',
        }),
      });
      assert(badLoginRes.status === 401, 'Bad credentials POST /login returns 401');

      // 5. Valid Login
      console.log('\n--- Test 5: Valid Login ---');
      const loginRes = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'securePassword123',
        }),
      });
      const loginData = await loginRes.json();
      assert(loginRes.status === 200, 'Valid credentials POST /login returns 200 OK');
      assert(!!loginData.token, 'Login returns new JWT token');

      // 6. Invalid / Bogus Token
      console.log('\n--- Test 6: Invalid/Tampered Token ---');
      const invalidTokenRes = await fetch(`${BASE_URL}/me`, {
        headers: { Authorization: 'Bearer thisIsAnInvalidBogusToken.1234.5678' },
      });
      assert(invalidTokenRes.status === 401, 'Tampered token returns 401 Unauthorized');

      // 7. Google OAuth Demo
      console.log('\n--- Test 7: Google OAuth Flow ---');
      const googleRes = await fetch(`${BASE_URL}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isDemo: true,
          email: 'google.student@prepverse.dev',
          name: 'Rohan Verma',
        }),
      });
      const googleData = await googleRes.json();
      assert(googleRes.status === 200, 'POST /google returns 200 OK');
      assert(googleData.user.provider === 'google', 'User provider recorded as google');
      assert(!!googleData.token, 'Google OAuth returns auth token');

      // 8. Logout
      console.log('\n--- Test 8: Logout ---');
      const logoutRes = await fetch(`${BASE_URL}/logout`, {
        method: 'POST',
      });
      const logoutData = await logoutRes.json();
      assert(logoutRes.status === 200, 'POST /logout returns 200 OK');
      assert(logoutData.success === true, 'Logout returns success');

      console.log(`\n========================================`);
      console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
      console.log(`========================================\n`);

      server.close(() => {
        process.exit(failed > 0 ? 1 : 0);
      });
    } catch (err) {
      console.error('Test execution error:', err);
      server.close(() => process.exit(1));
    }
  });
};

runTests();
