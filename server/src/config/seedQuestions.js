import AssessmentQuestion from '../models/AssessmentQuestion.js';

export const initialQuestions = [
  // DSA (2 Questions)
  {
    question:
      'Given an unsorted array of integers, what is the optimal average time complexity to find if two elements sum up to a target value using a Hash Map?',
    options: ['O(N²)', 'O(N log N)', 'O(N)', 'O(1)'],
    correctAnswer: 2, // O(N)
    category: 'DSA',
    difficulty: 'Easy',
    explanation:
      'Using a Hash Map, you can check for the complement (target - current) in O(1) average time, resulting in O(N) overall time complexity.',
  },
  {
    question:
      'What is the worst-case time complexity of searching for an element in an unbalanced Binary Search Tree (BST)?',
    options: ['O(log N)', 'O(N)', 'O(N log N)', 'O(1)'],
    correctAnswer: 1, // O(N)
    category: 'DSA',
    difficulty: 'Medium',
    explanation:
      'In the worst case, an unbalanced BST degenerates into a linked list (skewed tree), causing search operations to take O(N) time.',
  },

  // OOP (2 Questions)
  {
    question:
      'Which Object-Oriented Programming principle allows a child class to provide a specific implementation of a method that is already provided by its parent class?',
    options: [
      'Encapsulation',
      'Method Overloading (Compile-time Polymorphism)',
      'Method Overriding (Runtime Polymorphism)',
      'Data Abstraction',
    ],
    correctAnswer: 2, // Method Overriding
    category: 'OOP',
    difficulty: 'Easy',
    explanation:
      'Method overriding enables dynamic method dispatch at runtime, allowing subclasses to redefine behavior inherited from superclasses.',
  },
  {
    question:
      'In software design, what does the "D" in SOLID principles stand for, and what does it prescribe?',
    options: [
      'Data Normalization Principle: Keep database tables third-normal.',
      'Dependency Inversion Principle: High-level modules should depend on abstractions, not concretions.',
      'Dynamic Dispatch Principle: Always favor interfaces over concrete inheritance.',
      'Decoupled Service Principle: Separate microservice state completely.',
    ],
    correctAnswer: 1, // Dependency Inversion Principle
    category: 'OOP',
    difficulty: 'Medium',
    explanation:
      'The Dependency Inversion Principle states that high-level modules should not depend on low-level modules; both should depend on abstractions.',
  },

  // DBMS (2 Questions)
  {
    question:
      'What type of data structure is most widely used by relational databases (such as MySQL InnoDB or PostgreSQL) to implement clustered primary key indexes?',
    options: ['Hash Table', 'B+ Tree', 'Red-Black Tree', 'Skip List'],
    correctAnswer: 1, // B+ Tree
    category: 'DBMS',
    difficulty: 'Medium',
    explanation:
      'B+ Trees keep data ordered and all leaves at the same depth, which provides efficient point queries (O(log N)) and exceptionally fast range queries because leaf nodes are linked sequentially.',
  },
  {
    question:
      'Under the ACID transactional model, which property ensures that once a database transaction is committed, its effects will survive system crashes or power failures?',
    options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
    correctAnswer: 3, // Durability
    category: 'DBMS',
    difficulty: 'Easy',
    explanation:
      'Durability guarantees that committed transactions are permanently written to non-volatile storage (via write-ahead logging).',
  },

  // OS (2 Questions)
  {
    question:
      'What is a primary distinction between an Operating System Process and a Thread within the same process regarding memory?',
    options: [
      'Processes share their stack memory, while threads have separate stacks.',
      'Threads share the process address space (heap & code), but maintain their own private stack and registers.',
      'Processes have lighter context-switching overhead than threads.',
      'Threads have isolated virtual memory address spaces protected by hardware MMUs.',
    ],
    correctAnswer: 1, // Threads share address space
    category: 'OS',
    difficulty: 'Medium',
    explanation:
      'Threads within the same process share virtual address space, heap memory, and open file descriptors, while maintaining private program counters and stack frames.',
  },
  {
    question:
      'Which of the following is NOT one of the four necessary Coffman conditions required for a deadlock to occur?',
    options: [
      'Mutual Exclusion',
      'Hold and Wait',
      'Preemption of Resources by the Kernel',
      'Circular Wait',
    ],
    correctAnswer: 2, // Preemption
    category: 'OS',
    difficulty: 'Medium',
    explanation:
      'The necessary condition is "No Preemption" (resources cannot be forcibly confiscated). If preemption is allowed, deadlock cannot persist.',
  },

  // Networking (2 Questions)
  {
    question:
      'What is the standard sequence of flags exchanged during the TCP 3-Way Handshake to establish a reliable connection?',
    options: [
      'ACK ➔ SYN ➔ SYN-ACK',
      'SYN ➔ SYN-ACK ➔ ACK',
      'SYN ➔ ACK ➔ FIN',
      'DATA ➔ ACK ➔ FIN-ACK',
    ],
    correctAnswer: 1, // SYN -> SYN-ACK -> ACK
    category: 'Networking',
    difficulty: 'Easy',
    explanation:
      'Client sends SYN, server responds with SYN-ACK, client acknowledges with ACK to establish state.',
  },
  {
    question:
      'In HTTP REST APIs, what is the semantic difference between status code 401 Unauthorized and 403 Forbidden?',
    options: [
      '401 means server error; 403 means client rate-limit exceeded.',
      '401 means the client is unauthenticated (missing/invalid credentials); 403 means authenticated but lacks permission.',
      '401 is used for GET requests; 403 is used for POST requests.',
      '401 indicates expired SSL certificates; 403 indicates invalid CORS headers.',
    ],
    correctAnswer: 1, // 401 unauthenticated vs 403 forbidden
    category: 'Networking',
    difficulty: 'Easy',
    explanation:
      '401 Unauthorized signifies that credentials are required or failed verification. 403 Forbidden signifies identity is known but access is explicitly denied.',
  },

  // Programming Fundamentals (2 Questions)
  {
    question:
      'In modern asynchronous JavaScript/Node.js, where do resolved Promise callbacks (.then / await continuations) execute in the Event Loop?',
    options: [
      'Macrotask Queue (alongside setTimeout/setInterval)',
      'Microtask Queue (executed immediately after the current call stack clears)',
      'Worker Thread Pool',
      'Kernel I/O Polling Loop',
    ],
    correctAnswer: 1, // Microtask Queue
    category: 'Fundamentals',
    difficulty: 'Medium',
    explanation:
      'Promises resolve into the Microtask Queue, which has higher priority than the Macrotask Queue and drains before the next event loop tick.',
  },
  {
    question:
      'What problem occurs when a recursive function fails to reach its base termination condition?',
    options: [
      'Memory Fragmentation',
      'Stack Overflow',
      'Buffer Underflow',
      'Deadlock',
    ],
    correctAnswer: 1, // Stack Overflow
    category: 'Fundamentals',
    difficulty: 'Easy',
    explanation:
      'Each recursive function call pushes a new frame onto the call stack; without a terminating base case, the allocated stack memory exhausts, triggering a Stack Overflow.',
  },
];

export const seedAssessmentQuestions = async () => {
  try {
    const count = await AssessmentQuestion.countDocuments();
    if (count === 0) {
      console.log('[Seed] Seeding 12 placement diagnostic assessment questions...');
      await AssessmentQuestion.insertMany(initialQuestions);
      console.log('[Seed] Assessment questions seeded successfully.');
    }
  } catch (error) {
    console.error(`[Seed Error] Failed to seed questions: ${error.message}`);
  }
};
