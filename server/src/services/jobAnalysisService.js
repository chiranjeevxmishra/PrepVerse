import JobAnalysis from '../models/JobAnalysis.js';
import PreparationTask from '../models/PreparationTask.js';
import StudentProfile from '../models/StudentProfile.js';

const REQUIREMENT_CATALOG = [
  { name: 'DSA', group: 'topic', aliases: ['dsa', 'data structures and algorithms', 'data structures', 'algorithms'], profileKey: 'dsa', taskCategory: 'DSA' },
  { name: 'Java', group: 'skill', aliases: ['java'], taskCategory: 'Fundamentals' },
  { name: 'C++', group: 'skill', aliases: ['c\\+\\+', 'cpp', 'c plus plus'], taskCategory: 'Fundamentals' },
  { name: 'Python', group: 'skill', aliases: ['python'], taskCategory: 'Fundamentals' },
  { name: 'JavaScript', group: 'skill', aliases: ['javascript', 'js'], taskCategory: 'Fundamentals' },
  { name: 'React', group: 'skill', aliases: ['react', 'reactjs', 'react.js'], taskCategory: 'Fundamentals' },
  { name: 'Node.js', group: 'skill', aliases: ['node.js', 'nodejs'], taskCategory: 'Fundamentals' },
  { name: 'Express', group: 'skill', aliases: ['express', 'express.js'], taskCategory: 'Fundamentals' },
  { name: 'MongoDB', group: 'skill', aliases: ['mongodb', 'mongo db'], taskCategory: 'Fundamentals' },
  { name: 'SQL', group: 'skill', aliases: ['sql', 'structured query language'], profileKey: 'dbms', scoreSource: 'DBMS assessment (related proxy)', taskCategory: 'DBMS' },
  { name: 'DBMS', group: 'topic', aliases: ['dbms', 'database management systems', 'database systems'], profileKey: 'dbms', taskCategory: 'DBMS' },
  { name: 'Operating Systems', group: 'topic', aliases: ['operating systems', 'operating system', 'os'], profileKey: 'os', taskCategory: 'OS' },
  { name: 'Computer Networks', group: 'topic', aliases: ['computer networks', 'computer networking', 'networking'], profileKey: 'networking', taskCategory: 'Networking' },
  { name: 'OOP', group: 'topic', aliases: ['oop', 'object oriented programming', 'object-oriented programming'], profileKey: 'oop', taskCategory: 'OOP' },
  { name: 'REST APIs', group: 'skill', aliases: ['rest apis', 'rest api', 'restful apis', 'restful api'], taskCategory: 'Fundamentals' },
  { name: 'Git', group: 'skill', aliases: ['git', 'version control'], taskCategory: 'Fundamentals' },
  { name: 'System Design', group: 'topic', aliases: ['system design', 'distributed systems'], taskCategory: 'Fundamentals' },
  { name: 'Communication', group: 'soft-skill', aliases: ['communication', 'verbal communication', 'communication skills'], profileKey: 'communication', scoreSource: 'Self-assessment confidence', taskCategory: 'Interview' },
  { name: 'Problem Solving', group: 'soft-skill', aliases: ['problem solving', 'problem-solving', 'analytical skills'], profileKey: 'dsa', scoreSource: 'DSA assessment (related proxy)', taskCategory: 'DSA' },
];

const RECOMMENDATION_GUIDANCE = {
  DSA: { title: 'Practice DSA problem patterns', minutes: 40, tip: 'Work through one array or hash map problem, explain the approach, and check its time and space complexity.' },
  DBMS: { title: 'Review DBMS and SQL fundamentals', minutes: 30, tip: 'Practice SQL joins and aggregation, then review indexing, normalization, and transaction basics.' },
  OOP: { title: 'Review object-oriented design', minutes: 30, tip: 'Explain encapsulation, inheritance, polymorphism, and one SOLID principle with a small code example.' },
  OS: { title: 'Review operating systems fundamentals', minutes: 30, tip: 'Compare processes and threads, then review scheduling, synchronization, and virtual memory.' },
  Networking: { title: 'Review computer networking fundamentals', minutes: 30, tip: 'Trace a request from DNS lookup through TCP and HTTP, and explain the role of each layer.' },
  Interview: { title: 'Practice a concise interview response', minutes: 20, tip: 'Give a two-minute example and ask a peer to check clarity, structure, and listening.' },
  Fundamentals: { title: 'Validate the required skill with a small exercise', minutes: 30, tip: 'Build or explain a small example that demonstrates this job requirement, then note any gaps to revisit.' },
};

const containsAlias = (text, alias) => {
  const pattern = new RegExp(`(^|[^a-z0-9])(?:${alias})(?=$|[^a-z0-9])`, 'i');
  return pattern.test(text);
};

export const extractRequirements = (description) => {
  const normalized = description.replace(/\s+/g, ' ');
  const found = REQUIREMENT_CATALOG.filter((requirement) =>
    requirement.aliases.some((alias) => containsAlias(normalized, alias))
  );

  // Keep skills and topics separate for a readable, structured result.
  const extractedSkills = found.filter((item) => item.group === 'skill' || item.group === 'soft-skill').map((item) => item.name);
  const extractedTopics = found.filter((item) => item.group === 'topic').map((item) => item.name);
  return { found, extractedSkills, extractedTopics, requiredSkills: found.map((item) => item.name) };
};

const getProfileScore = (requirement, profile) => {
  if (!requirement.profileKey || profile?.readinessScore == null) return null;
  if (requirement.profileKey === 'communication') {
    const confidence = profile.selfAssessment?.communication;
    return confidence ? Math.min(100, Math.max(0, Number(confidence) * 20)) : null;
  }
  const scores = profile.categoryScores?.toObject?.() || profile.categoryScores || {};
  const score = scores[requirement.profileKey];
  return Number.isFinite(Number(score)) ? Number(score) : null;
};

const scoreMatch = (requirement, profile) => {
  const score = getProfileScore(requirement, profile);
  if (score === null) {
    return {
      status: 'unknown', score: null, scoreSource: null, contribution: 0,
      explanation: 'This requirement is not measured by your current profile; review it to validate your experience.',
    };
  }
  const status = score >= 70 ? 'strong' : score >= 55 ? 'developing' : 'needs_attention';
  const explanation = requirement.scoreSource
    ? `${requirement.scoreSource}: ${score}%. This is an indicator for the related requirement, not a direct skill test.`
    : `Your ${requirement.name} assessment score is ${score}%.`;
  const contribution = status === 'strong' ? 1 : status === 'developing' ? 0.65 : 0.25;
  return { status, score, scoreSource: requirement.scoreSource || `${requirement.name} assessment`, contribution, explanation };
};

export const calculateJobReadiness = (skillMatches) => {
  if (!skillMatches.length) return 0;
  const total = skillMatches.reduce((sum, item) => sum + item.contribution, 0);
  return Math.round((total / skillMatches.length) * 100);
};

const makeRecommendations = (found, matches) => matches
  .filter((match) => match.status !== 'strong')
  .map((match) => {
    const requirement = found.find((item) => item.name === match.name);
    const guidance = RECOMMENDATION_GUIDANCE[requirement.taskCategory];
    const priority = match.status === 'needs_attention' ? 'High' : 'Medium';
    const reason = match.status === 'unknown'
      ? `${match.name} appears in this job description but is not covered by your current assessment data.`
      : `${match.name} is required by this job and your current ${match.scoreSource?.toLowerCase() || 'profile score'} indicates a gap.`;
    return {
      skill: match.name,
      title: requirement.name === 'SQL' ? 'Practice SQL joins and queries' : `${requirement.name} — ${guidance.title}`,
      category: requirement.taskCategory,
      priority,
      estimatedTimeMinutes: guidance.minutes,
      reason,
      actionTip: requirement.name === 'SQL'
        ? 'Write queries using INNER and LEFT JOIN, GROUP BY, and aggregate functions; then review indexes and normalization.'
        : guidance.tip,
      preparationTask: null,
    };
  });

export const analyzeJobDescription = async ({ userId, title = '', company = '', description }) => {
  const profile = await StudentProfile.findOne({ user: userId });
  const extracted = extractRequirements(description);
  const skillMatches = extracted.found.map((requirement) => ({
    name: requirement.name,
    group: requirement.group,
    ...scoreMatch(requirement, profile),
  }));
  const summary = {
    strong: skillMatches.filter((item) => item.status === 'strong').length,
    developing: skillMatches.filter((item) => item.status === 'developing').length,
    needsAttention: skillMatches.filter((item) => item.status === 'needs_attention').length,
    unknown: skillMatches.filter((item) => item.status === 'unknown').length,
  };

  const analysis = await JobAnalysis.create({
    user: userId,
    title,
    company,
    rawDescription: description,
    ...extracted,
    skillMatches,
    readinessPercent: calculateJobReadiness(skillMatches),
    summary,
    readinessExplanation: 'Job readiness is the average of requirement match points: strong 100, developing 65, needs attention 25, unknown 0. It reflects available preparation evidence for this description and does not predict hiring outcomes.',
    recommendations: makeRecommendations(extracted.found, skillMatches),
  });
  return analysis;
};

export const addRecommendationToPreparationPlan = async ({ userId, analysisId, recommendationIndex }) => {
  const analysis = await JobAnalysis.findOne({ _id: analysisId, user: userId });
  if (!analysis) {
    const error = new Error('Job analysis not found.');
    error.statusCode = 404;
    throw error;
  }
  const recommendation = analysis.recommendations[recommendationIndex];
  if (!recommendation) {
    const error = new Error('Recommendation not found.');
    error.statusCode = 404;
    throw error;
  }
  if (recommendation.preparationTask) {
    const existing = await PreparationTask.findOne({ _id: recommendation.preparationTask, user: userId });
    if (existing) return { task: existing, alreadyAdded: true };
  }

  const profile = await StudentProfile.findOne({ user: userId });
  if (!profile) {
    const error = new Error('Complete your student profile before adding preparation tasks.');
    error.statusCode = 409;
    throw error;
  }
  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = await PreparationTask.find({ user: userId, date: today });
  const usedMinutes = todayTasks.reduce((sum, task) => sum + task.estimatedTimeMinutes, 0);
  const availableMinutes = Math.max(0, Number(profile.dailyPrepTimeHours || 2) * 60 - usedMinutes);
  if (recommendation.estimatedTimeMinutes > availableMinutes) {
    const error = new Error(`This task needs ${recommendation.estimatedTimeMinutes} minutes, but only ${availableMinutes} minutes remain in today's plan.`);
    error.statusCode = 409;
    throw error;
  }

  const task = await PreparationTask.create({
    user: userId,
    title: recommendation.title,
    category: recommendation.category,
    difficulty: 'Medium',
    priority: recommendation.priority,
    estimatedTimeMinutes: recommendation.estimatedTimeMinutes,
    reason: recommendation.reason,
    actionTip: recommendation.actionTip,
    date: today,
  });
  recommendation.preparationTask = task._id;
  await analysis.save();
  return { task, alreadyAdded: false };
};

export const listJobAnalyses = (userId) => JobAnalysis.find({ user: userId })
  .select('-rawDescription')
  .sort({ analyzedAt: -1 })
  .limit(50);

export const getJobAnalysis = (userId, id) => JobAnalysis.findOne({ _id: id, user: userId });
export const deleteJobAnalysis = (userId, id) => JobAnalysis.findOneAndDelete({ _id: id, user: userId });

export default { analyzeJobDescription, addRecommendationToPreparationPlan, listJobAnalyses, getJobAnalysis, deleteJobAnalysis };
