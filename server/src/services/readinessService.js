/**
 * Placement Readiness Calculation Service
 * Deterministic, transparent, and grounded in actual student performance.
 */

export const calculateReadinessScore = ({
  questionResults, // [{ category: 'DSA', isCorrect: true }, ...]
  selfAssessment = {}, // { dsa: 3, oop: 3, dbms: 2, os: 2, networking: 2, interview: 3, communication: 3 }
  projectsCount = 1,
  dailyPrepTimeHours = 2,
}) => {
  // 1. Group question results by category
  const categories = ['DSA', 'OOP', 'DBMS', 'OS', 'Networking', 'Fundamentals'];
  const categoryStats = {};

  categories.forEach((cat) => {
    categoryStats[cat] = { total: 0, correct: 0 };
  });

  questionResults.forEach((q) => {
    const cat = q.category || 'Fundamentals';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { total: 0, correct: 0 };
    }
    categoryStats[cat].total += 1;
    if (q.isCorrect) {
      categoryStats[cat].correct += 1;
    }
  });

  // 2. Map category names to self-assessment keys
  const selfKeyMap = {
    DSA: 'dsa',
    OOP: 'oop',
    DBMS: 'dbms',
    OS: 'os',
    Networking: 'networking',
    Fundamentals: 'oop',
  };

  // 3. Compute grounded category scores (75% test accuracy + 25% self-assessment confidence)
  const categoryScores = {};

  categories.forEach((cat) => {
    const stats = categoryStats[cat];
    const testAccuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 50;

    const selfKey = selfKeyMap[cat];
    const selfVal = selfAssessment[selfKey] || 3;
    const selfAccuracy = Math.min(100, Math.max(0, selfVal * 20)); // scale 1-5 to 20-100%

    // Blended score
    const blended = Math.round(0.75 * testAccuracy + 0.25 * selfAccuracy);
    categoryScores[cat.toLowerCase()] = Math.min(100, Math.max(0, blended));
  });

  // 4. Practical & Interview readiness score (based on projects, prep time, communication)
  const interviewSelf = (selfAssessment.interview || 3) * 10;
  const commSelf = (selfAssessment.communication || 3) * 10;
  const projectBonus = Math.min(30, (projectsCount || 1) * 10);
  const prepTimeBonus = Math.min(20, (dailyPrepTimeHours || 2) * 5);

  const practicalReadiness = Math.min(
    100,
    Math.round(interviewSelf + commSelf + projectBonus + prepTimeBonus)
  );

  // 5. Overall Readiness Score (Weighted Formula)
  // DSA: 35%, Core CS: 30% (DBMS 10%, OS 10%, Networking 10%), OOP/Fundamentals: 20%, Practical: 15%
  const overallReadiness = Math.round(
    0.35 * categoryScores.dsa +
      0.10 * categoryScores.dbms +
      0.10 * categoryScores.os +
      0.10 * categoryScores.networking +
      0.20 * categoryScores.oop +
      0.15 * practicalReadiness
  );

  // 6. Identify Strong & Weak Areas
  const strongAreas = [];
  const weakAreas = [];

  const displayNames = {
    dsa: 'Data Structures & Algorithms',
    oop: 'Object-Oriented Programming & Fundamentals',
    dbms: 'Database Management Systems',
    os: 'Operating Systems',
    networking: 'Computer Networks',
    fundamentals: 'Programming Fundamentals',
  };

  Object.entries(categoryScores).forEach(([key, score]) => {
    const label = displayNames[key] || key.toUpperCase();
    if (score >= 70) {
      strongAreas.push(label);
    } else if (score < 60) {
      weakAreas.push(label);
    }
  });

  // Ensure at least one weak or strong area for clear UX guidance
  if (strongAreas.length === 0) {
    strongAreas.push('Foundation Established');
  }
  if (weakAreas.length === 0 && overallReadiness < 90) {
    weakAreas.push('Advanced Edge Cases & Scalability');
  }

  // 7. Deterministic Actionable Recommendations
  const recommendations = [];

  if (categoryScores.dsa < 65) {
    recommendations.push({
      category: 'Data Structures & Algorithms',
      action: 'Solve 15 essential Two-Pointer & Hash Map pattern problems on LeetCode.',
      priority: 'High',
    });
  }

  if (categoryScores.dbms < 65) {
    recommendations.push({
      category: 'Database Systems',
      action: 'Revise ACID properties, B-Tree index lookups, and practice SQL aggregate queries.',
      priority: 'High',
    });
  }

  if (categoryScores.os < 65) {
    recommendations.push({
      category: 'Operating Systems',
      action: 'Review Process vs Thread memory layouts, Deadlock Coffman conditions, and Virtual Paging.',
      priority: 'Medium',
    });
  }

  if (categoryScores.networking < 65) {
    recommendations.push({
      category: 'Computer Networks',
      action: 'Study TCP 3-Way handshake, DNS lifecycle, and REST vs WebSocket protocols.',
      priority: 'Medium',
    });
  }

  if (categoryScores.oop < 65) {
    recommendations.push({
      category: 'OOP & System Design',
      action: 'Review SOLID principles with code examples in your primary programming language.',
      priority: 'Medium',
    });
  }

  if (projectsCount < 2) {
    recommendations.push({
      category: 'Projects & Resume',
      action: 'Build a full-stack project demonstrating authentication, API rate-limiting, and database indexing.',
      priority: 'High',
    });
  }

  // Default recommendation if student is already strong
  if (recommendations.length === 0) {
    recommendations.push({
      category: 'Mock Interviews',
      action: 'Conduct simulated technical mock interviews with peer problem-solving.',
      priority: 'Medium',
    });
  }

  return {
    overallReadiness: Math.min(100, Math.max(0, overallReadiness)),
    categoryScores,
    strongAreas,
    weakAreas,
    recommendations,
  };
};

export default calculateReadinessScore;
