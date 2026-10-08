/**
 * End-to-End Automated Test for Phase 2:
 * Student Profile + Diagnostic Assessment + Grounded Readiness Calculation + Dashboard Data
 */

import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { seedAssessmentQuestions } from './src/config/seedQuestions.js';

let server;

const runPhase2Tests = async () => {
  console.log('=== STARTING PHASE 2 VERTICAL SLICE TESTS ===\n');
  await connectDB();
  await seedAssessmentQuestions();

  server = app.listen(5002, async () => {
    const API = 'http://127.0.0.1:5002/api/v1';
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
      // Step 1: Register New Student
      console.log('--- Step 1: Student Registration ---');
      const testEmail = `student_p2_${Date.now()}@prepverse.dev`;
      const regRes = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Aarav Patel',
          email: testEmail,
          password: 'securePassword456',
        }),
      });
      const regData = await regRes.json();
      assert(regRes.status === 201, 'Student registered successfully (201)');
      const token = regData.token;
      assert(!!token, 'Auth token received');
      assert(regData.user.hasCompletedOnboarding === false, 'Initially hasCompletedOnboarding is false');

      const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // Step 2: Submit Multi-Step Onboarding Data
      console.log('\n--- Step 2: Onboarding Flow ---');
      const onboardingPayload = {
        targetRole: 'Software Development Engineer (SDE)',
        graduationYear: 2026,
        targetCompanies: ['FAANG / Tier-1 Tech', 'Product Companies'],
        languages: ['C++', 'JavaScript'],
        selfAssessment: {
          dsa: 4, // 80% confidence
          oop: 4, // 80% confidence
          dbms: 2, // 40% confidence (weak area)
          os: 3, // 60% confidence
          networking: 2, // 40% confidence (weak area)
          interview: 3,
          communication: 4,
        },
        projectsCount: 2,
        dailyPrepTimeHours: 3,
      };

      const onboardRes = await fetch(`${API}/profile/onboarding`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(onboardingPayload),
      });
      const onboardData = await onboardRes.json();
      assert(onboardRes.status === 200, 'Onboarding saved successfully (200)');
      assert(onboardData.profile.targetRole === 'Software Development Engineer (SDE)', 'Target role saved correctly');
      assert(onboardData.profile.selfAssessment.dsa === 4, 'Self-assessment DSA confidence recorded');

      // Step 3: Verify Profile via GET /profile/me
      console.log('\n--- Step 3: Retrieve Student Profile ---');
      const profileRes = await fetch(`${API}/profile/me`, { headers: authHeaders });
      const profileData = await profileRes.json();
      assert(profileRes.status === 200, 'GET /profile/me returns 200');
      assert(profileData.hasCompletedOnboarding === true, 'Profile indicates onboarding completed');
      assert(profileData.profile.readinessScore === null, 'Readiness score is null before assessment');

      // Step 4: Fetch Diagnostic Assessment Questions
      console.log('\n--- Step 4: Fetch Diagnostic Questions ---');
      const questionsRes = await fetch(`${API}/assessment/questions`, { headers: authHeaders });
      const questionsData = await questionsRes.json();
      assert(questionsRes.status === 200, 'GET /assessment/questions returns 200');
      assert(questionsData.questions.length >= 12, 'At least 12 diagnostic questions loaded');

      // Crucial Security Check: Ensure correct answers are NOT sent to client
      const leakedAnswer = questionsData.questions.some((q) => q.correctAnswer !== undefined);
      assert(!leakedAnswer, 'Security Check: Correct answers are NOT leaked in questions payload');

      // Step 5: Submit Diagnostic Assessment Answers
      console.log('\n--- Step 5: Submit Assessment & Calculate Readiness ---');
      // Intentionally answering some questions correctly and some incorrectly to verify grounded scoring
      const answers = questionsData.questions.map((q, idx) => {
        // DSA: answer correctly (e.g. index 2 and index 1)
        if (q.category === 'DSA') {
          return { questionId: q._id, selectedOption: q.options.length > 2 ? 2 : 1 };
        }
        // DBMS: pick option 0 (incorrect)
        if (q.category === 'DBMS') {
          return { questionId: q._id, selectedOption: 0 };
        }
        // Others: alternating
        return { questionId: q._id, selectedOption: idx % 2 === 0 ? 1 : 2 };
      });

      const submitRes = await fetch(`${API}/assessment/submit`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ answers }),
      });
      const submitData = await submitRes.json();
      assert(submitRes.status === 200, 'POST /assessment/submit returns 200');
      assert(typeof submitData.metrics.overallReadiness === 'number', 'Calculated overallReadiness is numeric');
      assert(
        submitData.metrics.overallReadiness >= 0 && submitData.metrics.overallReadiness <= 100,
        `Readiness score within valid bounds [0-100]: ${submitData.metrics.overallReadiness}`
      );
      assert(!!submitData.metrics.categoryScores.dsa, 'Category score computed for DSA');
      assert(!!submitData.metrics.categoryScores.dbms, 'Category score computed for DBMS');
      assert(submitData.metrics.weakAreas.length > 0, 'Identified weak areas list is non-empty');
      assert(submitData.metrics.recommendations.length > 0, 'Deterministic recommendations generated');

      // Step 6: Verify Dashboard State & Persistence
      console.log('\n--- Step 6: Verify Dashboard Data Retrieval ---');
      const resultsRes = await fetch(`${API}/assessment/results`, { headers: authHeaders });
      const resultsData = await resultsRes.json();
      assert(resultsRes.status === 200, 'GET /assessment/results returns 200');
      assert(resultsData.attempt.overallReadiness === submitData.metrics.overallReadiness, 'Attempt matches submitted score');
      assert(resultsData.profile.readinessScore === submitData.metrics.overallReadiness, 'Profile readiness score updated in DB');

      // Step 7: Check Updated User Auth /me endpoint
      console.log('\n--- Step 7: User Status Flags ---');
      const meRes = await fetch(`${API}/auth/me`, { headers: authHeaders });
      const meData = await meRes.json();
      assert(meData.user.hasCompletedOnboarding === true, 'User model: hasCompletedOnboarding is true');
      assert(meData.user.hasCompletedAssessment === true, 'User model: hasCompletedAssessment is true');

      console.log(`\n========================================`);
      console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
      console.log(`========================================\n`);

      server.close(() => {
        process.exit(failed > 0 ? 1 : 0);
      });
    } catch (err) {
      console.error('Test execution failure:', err);
      server.close(() => process.exit(1));
    }
  });
};

runPhase2Tests();
