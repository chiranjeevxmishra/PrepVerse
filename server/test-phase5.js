import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { PRACTICE_QUESTION_BANK } from './src/config/practiceQuestionBank.js';
import PracticeSession from './src/models/PracticeSession.js';
import StudentProfile from './src/models/StudentProfile.js';
import User from './src/models/User.js';
import { evaluatePracticeAnswer } from './src/services/practiceService.js';

let assertions = 0;
const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`);
  assertions += 1;
  console.log(`PASS: ${message}`);
};

const request = (url, { headers, body, method = 'GET' } = {}) => fetch(url, {
  method,
  headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

const run = async () => {
  await connectDB();
  const server = app.listen(5005);
  const api = 'http://127.0.0.1:5005/api/v1';
  const userIds = [];

  try {
    const register = async (name, email) => {
      const response = await request(`${api}/auth/register`, {
        method: 'POST', body: { name, email, password: 'securePassword456' },
      });
      const data = await response.json();
      if (data.user?._id) userIds.push(data.user._id);
      return { response, data, headers: { Authorization: `Bearer ${data.token}` } };
    };
    const first = await register('Practice Student', `phase5_${Date.now()}@prepverse.dev`);
    const second = await register('Other Student', `phase5_other_${Date.now()}@prepverse.dev`);
    assert(first.response.status === 201 && second.response.status === 201, 'Two isolated practice users can register');

    const unauthenticated = await request(`${api}/practice/sessions`, { method: 'POST', body: { category: 'DBMS', difficulty: 'Intermediate', durationMinutes: 15 } });
    assert(unauthenticated.status === 401, 'Practice session creation requires authentication');
    const invalidCategory = await request(`${api}/practice/sessions`, { method: 'POST', headers: first.headers, body: { category: 'Hacking', difficulty: 'Beginner', durationMinutes: 10 } });
    assert(invalidCategory.status === 400, 'Unsupported category is rejected');
    const invalidDifficulty = await request(`${api}/practice/sessions`, { method: 'POST', headers: first.headers, body: { category: 'DBMS', difficulty: 'Expert', durationMinutes: 10 } });
    assert(invalidDifficulty.status === 400, 'Unsupported difficulty is rejected');
    const invalidDuration = await request(`${api}/practice/sessions`, { method: 'POST', headers: first.headers, body: { category: 'DBMS', difficulty: 'Beginner', durationMinutes: 12 } });
    assert(invalidDuration.status === 400, 'Unsupported session duration is rejected');

    const onboarding = await request(`${api}/profile/onboarding`, {
      method: 'POST', headers: first.headers,
      body: { targetRole: 'Software Development Engineer (SDE)', graduationYear: 2026, dailyPrepTimeHours: 2,
        selfAssessment: { dsa: 4, oop: 4, dbms: 3, os: 3, networking: 3, interview: 3, communication: 3 } },
    });
    assert(onboarding.status === 200 || onboarding.status === 201, 'Practice test profile is created');
    const profile = await StudentProfile.findOne({});
    profile.readinessScore = 67;
    await profile.save();

    const startResponse = await request(`${api}/practice/sessions`, {
      method: 'POST', headers: first.headers,
      body: { category: 'DBMS', difficulty: 'Intermediate', durationMinutes: 15, score: 100 },
    });
    const started = await startResponse.json();
    assert(startResponse.status === 201, 'Valid practice session starts');
    assert(started.session.totalQuestions === 4 && started.currentQuestion.questionNumber === 1, 'Duration controls the curated question count');
    assert(!JSON.stringify(started).includes('expectedConcepts'), 'Private answer keys are not exposed at session start');
    assert(started.currentQuestion.questionId === 'dbms-normalization', 'Question selection is curated and stable for a new category');

    const emptyAnswer = await request(`${api}/practice/sessions/${started.session.id}/answers`, {
      method: 'POST', headers: first.headers, body: { questionId: started.currentQuestion.questionId, answer: '   ' },
    });
    assert(emptyAnswer.status === 400, 'Blank answers are rejected');
    const oversized = await request(`${api}/practice/sessions/${started.session.id}/answers`, {
      method: 'POST', headers: first.headers, body: { questionId: started.currentQuestion.questionId, answer: 'a'.repeat(4001) },
    });
    assert(oversized.status === 413, 'Oversized answers are rejected');
    const wrongQuestion = await request(`${api}/practice/sessions/${started.session.id}/answers`, {
      method: 'POST', headers: first.headers, body: { questionId: 'not-current', answer: 'some answer' },
    });
    assert(wrongQuestion.status === 409, 'Answers must match the current question');

    const selected = PRACTICE_QUESTION_BANK.DBMS.find((item) => item.id === started.currentQuestion.questionId).variants.Intermediate;
    const answer = 'In 1NF values are atomic. Functional dependencies show which attributes depend on keys. Moving to 3NF removes transitive dependencies and reduces update anomalies.';
    const pureFirst = evaluatePracticeAnswer({ answer, expectedConcepts: selected.expectedConcepts });
    const pureSecond = evaluatePracticeAnswer({ answer, expectedConcepts: selected.expectedConcepts });
    assert(JSON.stringify(pureFirst) === JSON.stringify(pureSecond), 'Repeated identical answers receive deterministic evaluation');
    const answerResponse = await request(`${api}/practice/sessions/${started.session.id}/answers`, {
      method: 'POST', headers: first.headers, body: { questionId: started.currentQuestion.questionId, answer, score: 1000 },
    });
    const answered = await answerResponse.json();
    assert(answerResponse.status === 200, 'A valid answer is accepted and persisted');
    assert(answered.evaluation.score === pureFirst.score && answered.evaluation.score <= 100, 'Evaluation score is computed by the server and ignores client score');
    assert(answered.evaluation.matchedConcepts.includes('Atomic values'), 'Evaluation reports matched concepts');
    assert(answered.nextQuestion.questionNumber === 2, 'Successful answer advances the session');
    const repeatAnswer = await request(`${api}/practice/sessions/${started.session.id}/answers`, {
      method: 'POST', headers: first.headers, body: { questionId: started.currentQuestion.questionId, answer },
    });
    assert(repeatAnswer.status === 409, 'An already answered question cannot be overwritten');

    const otherRead = await request(`${api}/practice/sessions/${started.session.id}`, { headers: second.headers });
    assert(otherRead.status === 404, 'A different user cannot read another practice session');
    const otherAnswer = await request(`${api}/practice/sessions/${started.session.id}/answers`, {
      method: 'POST', headers: second.headers, body: { questionId: answered.nextQuestion.questionId, answer: 'private' },
    });
    assert(otherAnswer.status === 404, 'A different user cannot answer another practice session');
    const otherComplete = await request(`${api}/practice/sessions/${started.session.id}/complete`, { method: 'POST', headers: second.headers });
    assert(otherComplete.status === 404, 'A different user cannot complete another practice session');

    const completeResponse = await request(`${api}/practice/sessions/${started.session.id}/complete`, { method: 'POST', headers: first.headers });
    const completed = await completeResponse.json();
    assert(completeResponse.status === 200 && completed.session.status === 'completed', 'Owner can complete a session early');
    assert(completed.session.overallScore >= 0 && completed.session.overallScore <= 100, 'Session summary contains a bounded server score');
    assert(!JSON.stringify(completed).includes('expectedConcepts'), 'Private answer keys stay hidden in the session summary');
    const persisted = await PracticeSession.findById(started.session.id);
    assert(persisted.status === 'completed' && persisted.questions[0].answer === answer, 'Answers and completion history are persisted');
    assert(persisted.questions[1].evaluation.score === 0, 'Unanswered questions receive zero in the final summary');
    const unchangedProfile = await StudentProfile.findById(profile._id);
    assert(unchangedProfile.readinessScore === 67, 'Practice does not change global readiness');

    const history = await request(`${api}/practice/sessions`, { headers: first.headers });
    const historyData = await history.json();
    assert(history.status === 200 && historyData.count === 1, 'User can view their own practice history');
    const otherHistory = await request(`${api}/practice/sessions`, { headers: second.headers });
    assert((await otherHistory.json()).count === 0, 'Practice history is isolated by user');
    const ownRead = await request(`${api}/practice/sessions/${started.session.id}`, { headers: first.headers });
    assert(ownRead.status === 200, 'Owner can retrieve a saved practice session');
    const invalidId = await request(`${api}/practice/sessions/not-an-id`, { headers: first.headers });
    assert(invalidId.status === 400, 'Malformed session IDs are rejected');

    console.log(`Task 5 checks passed: ${assertions}`);
  } finally {
    if (userIds.length) {
      await Promise.all([
        PracticeSession.deleteMany({ user: { $in: userIds } }),
        StudentProfile.deleteMany({ user: { $in: userIds } }),
        User.deleteMany({ _id: { $in: userIds } }),
      ]);
    }
    server.close();
  }
};

run().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
