import dotenv from 'dotenv';

dotenv.config();

const productionFrontendOrigin = 'https://prep-verse-six.vercel.app';
const configuredCorsOrigins = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(/[;,]/)
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

// Keep the known production frontend allowed even when Render still has the
// previous single-origin CORS_ORIGIN setting, while retaining configured dev origins.
const corsOrigins = [...new Set([...configuredCorsOrigins, productionFrontendOrigin])];

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/prepverse',
  CORS_ORIGINS: corsOrigins,
  JWT_SECRET: process.env.JWT_SECRET || 'prepverse_dev_secret_key_change_in_production_12345',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
};
