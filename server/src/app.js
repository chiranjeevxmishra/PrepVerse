import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.js';
import { createCorsOptions } from './config/corsOptions.js';
import { getDatabaseStatus } from './config/db.js';
import { createHealthzHandler } from './routes/healthz.js';
import v1Routes from './routes/v1/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
app.use(cors(createCorsOptions(ENV.CORS_ORIGINS)));

// Logging
if (ENV.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body & Cookie Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Root sanity endpoint
app.get('/healthz', createHealthzHandler(getDatabaseStatus));

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to PrepVerse API',
    docs: '/api/v1/health',
  });
});

// Mount Versioned API Routes
app.use('/api/v1', v1Routes);

// 404 & Centralized Error Handlers
app.use(notFound);
app.use(errorHandler);

export default app;
