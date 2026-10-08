import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import StudentProfile from './src/models/StudentProfile.js';
import PreparationTask from './src/models/PreparationTask.js';
import JobAnalysis from './src/models/JobAnalysis.js';
import User from './src/models/User.js';
import { calculateJobReadiness, extractRequirements } from './src/services/jobAnalysisService.js';

const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
};

const run = async () => {
  await connectDB();
  const server = app.listen(5004);
  const api = 'http://127.0.0.1:5004/api/v1';
  let testUserId;

  try {
    const email = `phase4_${Date.now()}@prepverse.dev`;
    const registerResponse = await fetch(`${api}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Phase 4 Student', email, password: 'securePassword456' }),
    });
    const registerData = await registerResponse.json();
    testUserId = registerData.user?._id;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${registerData.token}`,
    };
    assert(registerResponse.status === 201, 'Test student registered');

    const unauthenticated = await fetch(`${api}/jobs/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Strong DSA and DBMS' }),
    });
    assert(unauthenticated.status === 401, 'Unauthenticated analysis request is rejected');

    const emptyResponse = await fetch(`${api}/jobs/analyze`, {
      method: 'POST', headers, body: JSON.stringify({ description: '   ' }),
    });
    assert(emptyResponse.status === 400, 'Empty job description is rejected');

    const oversizedResponse = await fetch(`${api}/jobs/analyze`, {
      method: 'POST', headers, body: JSON.stringify({ description: 'x'.repeat(12001) }),
    });
    assert(oversizedResponse.status === 413, 'Oversized job description is rejected');

    await fetch(`${api}/profile/onboarding`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        targetRole: 'Software Development Engineer (SDE)',
        graduationYear: 2026,
        dailyPrepTimeHours: 2,
        selfAssessment: { dsa: 4, oop: 4, dbms: 2, os: 3, networking: 4, interview: 3, communication: 4 },
      }),
    });
    const profile = await StudentProfile.findOne({});
    profile.readinessScore = 72;
    profile.categoryScores = { dsa: 84, oop: 81, dbms: 42, os: 61, networking: 76, fundamentals: 70 };
    await profile.save();

    const description = `Software Engineer Intern\nRequirements:\nStrong DSA, Java, C++, Python, JavaScript, React, Node.js, Express, MongoDB, SQL, DBMS, Operating Systems, Computer Networks, OOP, REST APIs, Git, System Design, communication, and problem solving.`;
    const analysisResponse = await fetch(`${api}/jobs/analyze`, {
      method: 'POST', headers,
      body: JSON.stringify({ company: 'Example Co', title: 'Software Engineer Intern', description }),
    });
    const first = await analysisResponse.json();
    assert(analysisResponse.status === 201, 'Valid job description is analyzed and persisted');
    const analysis = first.analysis;
    const byName = Object.fromEntries(analysis.skillMatches.map((item) => [item.name, item]));
    assert(analysis.extractedSkills.includes('Java') && analysis.extractedTopics.includes('DBMS'), 'Parser extracts skills and CS topics separately');
    assert(byName.DSA.status === 'strong' && byName.DSA.score === 84, 'Strong DSA is matched against the existing assessment');
    assert(byName.DBMS.status === 'needs_attention' && byName.DBMS.score === 42, 'Weak DBMS is identified from the existing profile');
    assert(byName.SQL.status === 'needs_attention' && byName.SQL.scoreSource.includes('proxy'), 'SQL gap is transparently related to the DBMS score');
    assert(byName['REST APIs'].status === 'unknown' && byName['REST APIs'].score === null, 'Unassessed REST APIs remain unknown');
    assert(analysis.recommendations.some((item) => item.skill === 'DBMS' && item.priority === 'High'), 'Recommendations prioritize actual weak DBMS');
    assert(analysis.recommendations.some((item) => item.skill === 'Operating Systems' && item.priority === 'Medium'), 'Developing areas receive medium-priority recommendations');
    assert(analysis.recommendations.some((item) => item.skill === 'REST APIs'), 'Recommendations include unknown requirements to validate');
    assert(analysis.readinessPercent === calculateJobReadiness(analysis.skillMatches), 'Job readiness uses the transparent deterministic formula');
    assert(analysis.readinessPercent !== profile.readinessScore, 'Job readiness remains separate from global readiness');

    const repeatResponse = await fetch(`${api}/jobs/analyze`, {
      method: 'POST', headers,
      body: JSON.stringify({ company: 'Example Co', title: 'Software Engineer Intern', description }),
    });
    const repeat = await repeatResponse.json();
    assert(repeat.analysis.readinessPercent === analysis.readinessPercent, 'Repeated analysis produces a deterministic job score');

    // No AI provider is configured. The local parser remains usable without external services.
    const fallback = extractRequirements('Requires DSA, Java, SQL, REST APIs, Git, and communication.');
    assert(fallback.requiredSkills.includes('REST APIs') && fallback.requiredSkills.includes('DSA'), 'Deterministic extraction works without an AI provider');

    const recommendationIndex = analysis.recommendations.findIndex((item) => item.skill === 'DBMS');
    const addResponse = await fetch(`${api}/jobs/${analysis._id}/tasks/${recommendationIndex}`, { method: 'POST', headers });
    const added = await addResponse.json();
    assert(addResponse.status === 201 && added.task.category === 'DBMS', 'A job gap is added to the existing preparation-task system');
    const repeatAdd = await fetch(`${api}/jobs/${analysis._id}/tasks/${recommendationIndex}`, { method: 'POST', headers });
    assert(repeatAdd.status === 200 && (await repeatAdd.json()).alreadyAdded, 'Adding the same recommendation is idempotent');
    assert(await PreparationTask.countDocuments({ user: profile.user }) === 1, 'Job recommendation creates one persisted preparation task');

    const listResponse = await fetch(`${api}/jobs`, { headers });
    const listed = await listResponse.json();
    assert(listed.count === 2 && !Object.hasOwn(listed.analyses[0], 'rawDescription'), 'User history is listed without returning raw descriptions');
    const detailResponse = await fetch(`${api}/jobs/${analysis._id}`, { headers });
    assert(detailResponse.status === 200, 'Saved analysis can be retrieved');
    const deleteResponse = await fetch(`${api}/jobs/${repeat.analysis._id}`, { method: 'DELETE', headers });
    assert(deleteResponse.status === 200, 'Saved analysis can be deleted');
  } finally {
    if (testUserId) {
      await Promise.all([
        JobAnalysis.deleteMany({ user: testUserId }),
        PreparationTask.deleteMany({ user: testUserId }),
        StudentProfile.deleteOne({ user: testUserId }),
        User.deleteOne({ _id: testUserId }),
      ]);
    }
    server.close();
  }
};

run().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
