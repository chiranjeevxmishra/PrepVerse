import PreparationTask from '../models/PreparationTask.js';
import StudentProfile from '../models/StudentProfile.js';

/**
 * Curated Repository of High-Yield Placement Modules
 * Mapped to categories, difficulties, and actionable tips
 */
const CURRICULUM_CATALOG = {
  dbms: [
    {
      title: 'Master B+ Tree Indexing & Clustered Indexes',
      category: 'DBMS',
      difficulty: 'Medium',
      estimatedTimeMinutes: 45,
      getReason: (score) =>
        `Your DBMS score is ${score}%, currently your primary skill gap. Database indexing is tested in 80% of tech rounds.`,
      actionTip:
        'Understand clustered vs secondary B+ Tree structures. Practice writing an EXPLAIN query in SQL to identify full table scans.',
    },
    {
      title: 'ACID Transaction Semantics & Isolation Levels',
      category: 'DBMS',
      difficulty: 'Medium',
      estimatedTimeMinutes: 40,
      getReason: (score) =>
        `Your DBMS score is ${score}%. Concurrency phenomena (dirty reads vs phantom reads) are standard interview filters.`,
      actionTip:
        'Compare Read Committed with Repeatable Read. Learn how MVCC and two-phase locking prevent race conditions.',
    },
    {
      title: 'Relational Database Normalization (1NF to 3NF)',
      category: 'DBMS',
      difficulty: 'Easy',
      estimatedTimeMinutes: 30,
      getReason: (score) =>
        `Your DBMS score is ${score}%. Normal forms prevent update anomalies in technical design rounds.`,
      actionTip:
        'Identify functional dependencies and practice decomposing an unnormalized table into Third Normal Form (3NF).',
    },
  ],

  dsa: [
    {
      title: 'Two-Pointer & Sliding Window Problem Solving',
      category: 'DSA',
      difficulty: 'Medium',
      estimatedTimeMinutes: 50,
      getReason: (score) =>
        `DSA represents 35% of your placement readiness score (${score}%). Two-pointer arrays are the highest-frequency interview pattern.`,
      actionTip:
        'Solve 2 classic problems: Container With Most Water (LeetCode #11) and Longest Substring Without Repeating Characters (#3).',
    },
    {
      title: 'Hash Map Frequency & Complement Lookup Optimization',
      category: 'DSA',
      difficulty: 'Easy',
      estimatedTimeMinutes: 35,
      getReason: (score) =>
        `DSA represents 35% of your placement score (${score}%). Hash Maps are the foundational technique to reduce O(N²) to O(N).`,
      actionTip:
        'Solve Two Sum and Group Anagrams. Verify understanding of bucket collisions and average O(1) vs worst-case O(N) lookups.',
    },
    {
      title: 'Binary Search on Sorted Arrays & Search Space Range',
      category: 'DSA',
      difficulty: 'Medium',
      estimatedTimeMinutes: 45,
      getReason: (score) =>
        `DSA score is ${score}%. Binary search beyond simple arrays (e.g. search space bounds) is tested by top product firms.`,
      actionTip:
        'Implement binary search edge cases: lower_bound, upper_bound, and solve Search in Rotated Sorted Array.',
    },
  ],

  os: [
    {
      title: 'Process vs Thread Memory Spaces & Concurrency',
      category: 'OS',
      difficulty: 'Medium',
      estimatedTimeMinutes: 40,
      getReason: (score) =>
        `Your OS score is ${score}%. Interviewers regularly probe virtual address layout, heap vs stack sharing.`,
      actionTip:
        'Draw the process virtual address space. Contrast IPC mechanisms (pipes, sockets) with thread race conditions and mutexes.',
    },
    {
      title: 'Deadlock Necessary Conditions & Prevention Strategies',
      category: 'OS',
      difficulty: 'Easy',
      estimatedTimeMinutes: 30,
      getReason: (score) =>
        `Your OS score is ${score}%. Deadlock prevention and the 4 Coffman conditions are classic interview screening topics.`,
      actionTip:
        'Review the 4 Coffman conditions. Explain why resource hierarchy ordering prevents circular wait conditions.',
    },
    {
      title: 'Virtual Memory, Paging, and Page Faults',
      category: 'OS',
      difficulty: 'Medium',
      estimatedTimeMinutes: 40,
      getReason: (score) =>
        `Your OS score is ${score}%. Understanding thrashing and Translation Lookaside Buffers (TLB) differentiates candidates.`,
      actionTip:
        'Simulate LRU and FIFO page replacement on a given reference string. Understand why 4KB page frames are standard.',
    },
  ],

  networking: [
    {
      title: 'TCP 3-Way Handshake & Reliable Transmission',
      category: 'Networking',
      difficulty: 'Medium',
      estimatedTimeMinutes: 35,
      getReason: (score) =>
        `Your Computer Networks score is ${score}%. Connection establishment and teardown are mandatory CS core topics.`,
      actionTip:
        'Trace SYN, SYN-ACK, ACK sequence numbers. Explain the purpose of TIME_WAIT state in preventing delayed packet duplicates.',
    },
    {
      title: 'HTTP/1.1 vs HTTP/2 vs WebSocket Architecture',
      category: 'Networking',
      difficulty: 'Easy',
      estimatedTimeMinutes: 30,
      getReason: (score) =>
        `Your Networks score is ${score}%. System design interviews test protocol multiplexing and full-duplex communication.`,
      actionTip:
        'Contrast HTTP/1.1 Head-of-Line blocking with HTTP/2 binary framing streams. Learn when WebSockets are preferred over polling.',
    },
  ],

  oop: [
    {
      title: 'SOLID Principles Implementation in Code',
      category: 'OOP',
      difficulty: 'Medium',
      estimatedTimeMinutes: 40,
      getReason: (score) =>
        `Your OOP score is ${score}%. Object-oriented design rounds evaluate Dependency Inversion and Open-Closed principles.`,
      actionTip:
        'Refactor a sample monolithic payment class into an extensible interface-driven design adhering to Dependency Inversion.',
    },
    {
      title: 'Polymorphism: Method Overloading vs Overriding',
      category: 'OOP',
      difficulty: 'Easy',
      estimatedTimeMinutes: 30,
      getReason: (score) =>
        `Your OOP score is ${score}%. Understanding runtime dynamic dispatch vs compile-time binding is a staple placement question.`,
      actionTip:
        'Explain virtual tables (vtable) and dynamic method lookup in your primary object-oriented language.',
    },
  ],

  interview: [
    {
      title: 'Mock Interview: Explain System Logic with STAR Method',
      category: 'Interview',
      difficulty: 'Medium',
      estimatedTimeMinutes: 30,
      getReason: () =>
        'Communication and verbalizing technical trade-offs carry 15% of your placement readiness weighting.',
      actionTip:
        'Take your best portfolio project and articulate the Situation, Task, Action, and Result in under 2 minutes.',
    },
  ],
};

/**
 * Deterministically generate or retrieve Today's Preparation Plan
 */
export const getOrGenerateTodaysPlan = async (user, profile) => {
  const today = new Date().toISOString().split('T')[0];

  // 1. Check if tasks for today already exist
  const existingTasks = await PreparationTask.find({
    user: user._id,
    date: today,
  }).sort({ status: 1, createdAt: 1 });

  if (existingTasks && existingTasks.length > 0) {
    return existingTasks;
  }

  // 2. Fetch past completed task titles to avoid repeating the same task
  const pastCompletedTasks = await PreparationTask.find({
    user: user._id,
    status: 'completed',
  }).select('title');
  const completedTitles = new Set(pastCompletedTasks.map((t) => t.title));

  // Rank gaps by size and the weights already used by the readiness calculation.
  const scores = profile.categoryScores?.toObject?.() || profile.categoryScores || {};
  const interviewConfidence = profile.selfAssessment?.interview;
  if (interviewConfidence && scores.interview === undefined) {
    scores.interview = interviewConfidence * 20;
  }
  const weights = { dsa: 0.35, oop: 0.20, dbms: 0.10, os: 0.10, networking: 0.10, interview: 0.15 };
  const rankedCategories = Object.entries(CURRICULUM_CATALOG).map(([category, tasks]) => {
    const score = Number(scores[category] ?? 50);
    return { category, score, tasks, rank: (100 - score) + (weights[category] || 0.1) * 10 };
  }).sort((a, b) => b.rank - a.rank);

  let remainingMinutes = Math.max(0, Number(profile.dailyPrepTimeHours || 2) * 60);
  const selectedTasks = [];
  for (const ranked of rankedCategories) {
    const blueprint = ranked.tasks.find((item) => !completedTitles.has(item.title));
    if (!blueprint || blueprint.estimatedTimeMinutes > remainingMinutes) continue;
    const priority = ranked.rank >= 65 ? 'High' : ranked.rank >= 35 ? 'Medium' : 'Low';
    selectedTasks.push({
      user: user._id,
      title: blueprint.title,
      category: blueprint.category,
      difficulty: blueprint.difficulty,
      priority,
      estimatedTimeMinutes: blueprint.estimatedTimeMinutes,
      reason: `${blueprint.getReason(ranked.score)} This area is prioritized using your skill gap and its existing readiness weight.`,
      actionTip: blueprint.actionTip,
      date: today,
      status: 'pending',
    });
    remainingMinutes -= blueprint.estimatedTimeMinutes;
  }

  // Insert generated tasks into MongoDB
  const createdTasks = await PreparationTask.insertMany(selectedTasks);
  return createdTasks;
};

/**
 * Mark a task as completed and update student metrics deterministically
 */
export const markTaskCompleted = async (userId, taskId) => {
  const task = await PreparationTask.findOne({ _id: taskId, user: userId });

  if (!task) {
    const error = new Error('Preparation task not found.');
    error.statusCode = 404;
    throw error;
  }

  const profile = await StudentProfile.findOne({ user: userId });
  if (!profile) {
    const error = new Error('Student profile not found.');
    error.statusCode = 404;
    throw error;
  }

  if (task.status === 'completed') {
    return { task, profile, alreadyCompleted: true };
  }

  // Completion tracks practice activity; readiness stays based on assessment evidence.
  task.status = 'completed';
  task.completedAt = new Date();
  await task.save();

  profile.tasksCompletedCount = (profile.tasksCompletedCount || 0) + 1;
  await profile.save();
  return { task, profile, alreadyCompleted: false };
};

export default {
  getOrGenerateTodaysPlan,
  markTaskCompleted,
};
