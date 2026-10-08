import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import User from './src/models/User.js';
import StudentProfile from './src/models/StudentProfile.js';

let assertions = 0;
const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`);
  assertions += 1;
  console.log(`PASS: ${message}`);
};

const request = (url, { method = 'GET', token, body } = {}) => fetch(url, {
  method,
  headers: {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
  },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

const run = async () => {
  await connectDB();
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const api = `http://127.0.0.1:${server.address().port}/api/v1`;
  const userIds = [];

  try {
    const register = async (label) => {
      const response = await request(`${api}/auth/register`, {
        method: 'POST',
        body: {
          name: `Peer test ${label}`,
          email: `peer_${label.toLowerCase()}_${Date.now()}_${Math.random().toString(16).slice(2)}@prepverse.dev`,
          password: 'securePassword456',
        },
      });
      const data = await response.json();
      if (data.user?.id) userIds.push(data.user.id);
      return { response, data, token: data.token };
    };

    const first = await register('First');
    const second = await register('Second');
    const incomplete = await register('Incomplete');
    assert(first.response.status === 201 && second.response.status === 201 && incomplete.response.status === 201, 'Test users register through the existing authentication API');

    const unauthenticated = await request(`${api}/collaboration/matches`);
    assert(unauthenticated.status === 401, 'Peer matches reject unauthenticated requests');

    const firstProfile = await request(`${api}/profile/onboarding`, {
      method: 'POST', token: first.token,
      body: { targetRole: 'Software Development Engineer (SDE)', graduationYear: 2027 },
    });
    const secondProfile = await request(`${api}/profile/onboarding`, {
      method: 'POST', token: second.token,
      body: { targetRole: 'Software Development Engineer (SDE)', graduationYear: 2027 },
    });
    assert(firstProfile.status === 200 && secondProfile.status === 200, 'Onboarding creates real matching profiles');

    const noProfile = await request(`${api}/collaboration/matches`, { token: incomplete.token });
    assert(noProfile.status === 404, 'Matching explains when onboarding is required');

    const peerProfile = await request(`${api}/collaboration/peer-profile`, { token: first.token });
    const peerProfileData = await peerProfile.json();
    assert(peerProfile.status === 200 && peerProfileData.profile.learningInterests.length === 0, 'Peer profile endpoint returns the saved profile contract');

    const matchesResponse = await request(`${api}/collaboration/matches`, { token: first.token });
    const matchData = await matchesResponse.json();
    assert(matchesResponse.status === 200 && Array.isArray(matchData.matches), 'Authenticated matching endpoint returns a matches array');
    assert(matchData.matches.some((match) => String(match.user.id) === second.data.user.id), 'Same target-role peers receive the documented positive role score without fabricated skill ratings');
    assert(matchData.matches.every((match) => String(match.user.id) !== first.data.user.id), 'Matching never returns the current user');
    assert(matchData.matches.every((match) => match.score > 0 && Array.isArray(match.reasons) && match.candidateSkills), 'Every match includes a positive score, reasons, and skill summary for the UI');

    const update = await request(`${api}/collaboration/peer-profile`, {
      method: 'PATCH', token: first.token,
      body: { learningInterests: ['Graph algorithms'], peerSkills: [{ name: 'System design', score: 80 }] },
    });
    const updateData = await update.json();
    assert(update.status === 200 && updateData.profile.peerSkills[0].score === 80, 'Peer profile updates persist through the existing endpoint');

    const invalidUpdate = await request(`${api}/collaboration/peer-profile`, {
      method: 'PATCH', token: first.token,
      body: { learningInterests: 'Graph algorithms', peerSkills: [] },
    });
    assert(invalidUpdate.status === 400, 'Invalid peer profile input is rejected');

    console.log(`Peer matching checks passed: ${assertions}`);
  } finally {
    if (userIds.length) {
      await StudentProfile.deleteMany({ user: { $in: userIds } });
      await User.deleteMany({ _id: { $in: userIds } });
    }
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
};

run().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
