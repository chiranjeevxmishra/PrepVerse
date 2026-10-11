import app from './app.js';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { connectDB } from './config/db.js';
import { seedAssessmentQuestions } from './config/seedQuestions.js';
import { ENV } from './config/env.js';
import { attachSocketServer } from './realtime/socketServer.js';
import { startInterviewReminderScheduler } from './services/notificationService.js';

const listen = (server, port) => new Promise((resolve, reject) => {
  const onListening = () => {
    server.removeListener('error', onError);
    resolve();
  };
  const onError = (error) => {
    server.removeListener('listening', onListening);
    reject(new Error(`HTTP server failed to bind (${error.code || 'unknown error'}).`));
  };

  server.once('error', onError);
  server.once('listening', onListening);
  try {
    server.listen(port, '0.0.0.0');
  } catch (error) {
    onError(error);
  }
});

export const startServer = async ({
  appInstance = app,
  connect = connectDB,
  seed = seedAssessmentQuestions,
  startScheduler = startInterviewReminderScheduler,
  attachSockets = attachSocketServer,
  createHttpServer = (application) => createServer(application),
  port = ENV.PORT,
  logger = console,
} = {}) => {
  // Do not accept traffic until MongoDB and required seed data are ready.
  const connection = await connect();
  if (!connection) throw new Error('Database initialization did not complete.');

  await seed();
  startScheduler();

  const server = createHttpServer(appInstance);
  attachSockets(server);
  await listen(server, port);
  logger.log(`[PrepVerse Server] Running in ${ENV.NODE_ENV} mode on port ${port}`);
  logger.log(`[PrepVerse Server] Health check: http://localhost:${port}/healthz`);

  return server;
};

const isDirectExecution = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  let server;
  process.on('unhandledRejection', (error) => {
    const message = error instanceof Error ? error.message : 'Unknown rejection';
    console.error(`[Unhandled Rejection] ${message}`);
    if (server) server.close(() => { process.exitCode = 1; });
    else process.exitCode = 1;
  });

  startServer().then((startedServer) => {
    server = startedServer;
  }).catch((error) => {
    console.error(`[Startup Error] ${error.message}`);
    process.exitCode = 1;
  });
}
