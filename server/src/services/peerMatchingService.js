const ASSESSMENT_SKILLS = {
  dsa: 'DSA',
  dbms: 'DBMS',
  oop: 'OOP',
  os: 'Operating Systems',
  networking: 'Networking',
  fundamentals: 'Fundamentals',
  interview: 'Interview',
  communication: 'Communication',
};

const normalizeKey = (value) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const getRatings = (profile) => {
  const ratings = new Map();
  for (const [key, label] of Object.entries(ASSESSMENT_SKILLS)) {
    const categoryScore = profile.categoryScores?.[key];
    const confidence = profile.selfAssessment?.[key];
    if (Number.isFinite(categoryScore) && categoryScore > 0) ratings.set(normalizeKey(label), { name: label, score: categoryScore });
    else if (Number.isFinite(confidence)) ratings.set(normalizeKey(label), { name: label, score: confidence * 20 });
  }
  for (const skill of profile.peerSkills || []) {
    ratings.set(normalizeKey(skill.name), { name: skill.name, score: skill.score });
  }
  for (const name of profile.strongAreas || []) {
    const key = normalizeKey(name);
    if (!ratings.has(key)) ratings.set(key, { name, score: 80 });
  }
  for (const name of profile.weakAreas || []) {
    const key = normalizeKey(name);
    if (!ratings.has(key)) ratings.set(key, { name, score: 40 });
  }
  return ratings;
};

const publicSkillSummary = (ratings) => {
  const skills = [...ratings.values()];
  return {
    strengths: skills.filter((skill) => skill.score >= 70).map(({ name, score }) => ({ name, score })).sort((a, b) => b.score - a.score),
    weaknesses: skills.filter((skill) => skill.score <= 60).map(({ name, score }) => ({ name, score })).sort((a, b) => a.score - b.score),
  };
};

export const calculatePeerMatch = (student, candidate) => {
  const studentRatings = getRatings(student);
  const candidateRatings = getRatings(candidate);
  const reasons = [];
  let score = 0;

  for (const [key, studentSkill] of studentRatings) {
    const candidateSkill = candidateRatings.get(key);
    if (!candidateSkill) continue;
    if (studentSkill.score >= 70 && candidateSkill.score <= 60) {
      score += 16;
      reasons.push(`${studentSkill.name} is a strength for you and a learning area for ${candidate.user.name}.`);
    }
    if (candidateSkill.score >= 70 && studentSkill.score <= 60) {
      score += 16;
      reasons.push(`${candidate.user.name}'s ${candidateSkill.name} strength complements your learning area.`);
    }
  }

  if (student.targetRole && candidate.targetRole && normalizeKey(student.targetRole) === normalizeKey(candidate.targetRole)) {
    score += 15;
    reasons.push(`You are both preparing for ${student.targetRole} roles.`);
  }

  const studentInterests = new Set((student.learningInterests || []).map(normalizeKey));
  const sharedInterests = [...new Set((candidate.learningInterests || []).filter((interest) => studentInterests.has(normalizeKey(interest))))];
  for (const interest of sharedInterests.slice(0, 3)) {
    score += 7;
    reasons.push(`You both want to learn ${interest}.`);
  }

  const candidateSummary = publicSkillSummary(candidateRatings);
  const studentSummary = publicSkillSummary(studentRatings);
  return {
    score: Math.min(100, score),
    reasons,
    sharedInterests,
    studentSkills: studentSummary,
    candidateSkills: candidateSummary,
    complement: reasons.some((reason) => /strength.*learning area|strength complements/i.test(reason)),
  };
};

export const rankPeerMatches = (student, candidates, limit = 10) => candidates
  .map((candidate) => ({
    user: { id: candidate.user._id, name: candidate.user.name, avatar: candidate.user.avatar },
    targetRole: candidate.targetRole,
    learningInterests: candidate.learningInterests || [],
    ...calculatePeerMatch(student, candidate),
  }))
  .filter((candidate) => candidate.score > 0)
  .sort((a, b) => b.score - a.score || a.user.name.localeCompare(b.user.name))
  .slice(0, limit);

export default { calculatePeerMatch, rankPeerMatches };
