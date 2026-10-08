import app from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';

const startServer = async () => {
  // Start HTTP Server immediately
  const server = app.listen(ENV.PORT, () => {
    console.log(`[PrepVerse Server] Running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`);
    console.log(`[PrepVerse Server] Health check: http://localhost:${ENV.PORT}/api/v1/health`);
  });

  // Connect to Database asynchronously
  connectDB();

  // Handle unhandled promise rejections gracefully
  process.on('unhandledRejection', (err) => {
    console.error(`[Unhandled Rejection] ${err.message}`);
    server.close(() => process.exit(1));
  });
};

startServer();
