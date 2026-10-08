import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ENV } from './config/env.js';
import v1Routes from './routes/v1/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
app.use(
  cors({
    origin: ENV.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Logging
if (ENV.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root sanity endpoint
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
