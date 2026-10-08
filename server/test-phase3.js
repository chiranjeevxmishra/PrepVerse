import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import StudentProfile from './src/models/StudentProfile.js';
import PreparationTask from './src/models/PreparationTask.js';

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
};

const run = async () => {
  await connectDB();
  const server = app.listen(5003);
  const api = 'http://127.0.0.1:5003/api/v1';

  try {
    const email = `phase3_${Date.now()}@prepverse.dev`;
    const registerResponse = await fetch(`${api}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Phase 3 Student', email, password: 'securePassword456' }),
    });
    const registerData = await registerResponse.json();
    assert(registerResponse.status === 201, 'Student can register');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${registerData.token}`,
    };

    const beforeAssessment = await fetch(`${api}/plan/today`, { headers });
    const beforeData = await beforeAssessment.json();
    assert(beforeData.requiresAssessment && beforeData.tasks.length === 0, 'Plan waits for assessment data');

    await fetch(`${api}/profile/onboarding`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ targetRole: 'Software Development Engineer (SDE)', graduationYear: 2026, dailyPrepTimeHours: 1 }),
    });
    const profile = await StudentProfile.findOne({});
    profile.readinessScore = 60;
    profile.categoryScores = { dsa: 35, oop: 50, dbms: 90, os: 50, networking: 50, fundamentals: 50 };
    await profile.save();

    let planResponse = await fetch(`${api}/plan/today`, { headers });
    let plan = await planResponse.json();
    assert(plan.tasks[0]?.category === 'DSA', 'Weak DSA is prioritized over strong DBMS');
    assert(plan.tasks[0]?.priority === 'High', 'Large skill gaps receive high priority');
    assert(plan.stats.totalMinutes <= 60, 'Plan fits within a 60-minute daily budget');

    const readinessBeforeCompletion = plan.profile.readinessScore;
    const taskId = plan.tasks[0]._id;
    const completionResponse = await fetch(`${api}/plan/tasks/${taskId}/complete`, { method: 'PATCH', headers });
    const completion = await completionResponse.json();
    assert(completionResponse.status === 200 && completion.task.status === 'completed', 'Task completion is persisted');
    assert(completion.profile.readinessScore === readinessBeforeCompletion, 'Completion does not invent a readiness score increase');
    assert(completion.profile.tasksCompletedCount === 1, 'Completed-task count is persisted');

    planResponse = await fetch(`${api}/plan/today`, { headers });
    plan = await planResponse.json();
    assert(plan.tasks.find((task) => task._id === taskId)?.status === 'completed', 'Refresh keeps task completed');
    const repeatedCompletion = await fetch(`${api}/plan/tasks/${taskId}/complete`, { method: 'PATCH', headers });
    assert((await repeatedCompletion.json()).profile.tasksCompletedCount === 1, 'Repeated completion does not double count');

    await PreparationTask.deleteMany({ user: profile.user });
    profile.categoryScores = { dsa: 90, oop: 50, dbms: 35, os: 50, networking: 50, fundamentals: 50 };
    await profile.save();
    planResponse = await fetch(`${api}/plan/today`, { headers });
    plan = await planResponse.json();
    assert(plan.tasks[0]?.category === 'DBMS', 'Weak DBMS is prioritized over strong DSA');
    assert(plan.tasks[0]?.priority === 'High', 'Weak DBMS task receives high priority');
    assert(plan.stats.totalMinutes <= 60, 'DBMS plan also stays within daily time budget');

    const invalidTaskResponse = await fetch(`${api}/plan/tasks/not-an-id/complete`, { method: 'PATCH', headers });
    assert(invalidTaskResponse.status === 400, 'Invalid task ID is rejected');
    const unauthorizedResponse = await fetch(`${api}/plan/today`);
    assert(unauthorizedResponse.status === 401, 'Unauthenticated plan request is rejected');
  } finally {
    server.close();
  }
};

run().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
