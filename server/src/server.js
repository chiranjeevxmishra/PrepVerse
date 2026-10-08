import app from './app.js';
import { connectDB } from './config/db.js';
import { seedAssessmentQuestions } from './config/seedQuestions.js';
import { ENV } from './config/env.js';
import { attachSocketServer } from './realtime/socketServer.js';
import { startInterviewReminderScheduler } from './services/notificationService.js';

const startServer = async () => {
  // Start HTTP Server immediately
  const server = app.listen(ENV.PORT, '0.0.0.0', () => {
    console.log(
      `[PrepVerse Server] Running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`
    );
    console.log(
      `[PrepVerse Server] Health check: http://localhost:${ENV.PORT}/api/v1/health`
    );
  });

  attachSocketServer(server);

  // Connect to Database asynchronously and seed diagnostic questions
  connectDB().then(() => {
    seedAssessmentQuestions();
    startInterviewReminderScheduler();
  });

  // Handle unhandled promise rejections gracefully
  process.on('unhandledRejection', (err) => {
    console.error(`[Unhandled Rejection] ${err.message}`);
    server.close(() => process.exit(1));
  });
};

startServer();