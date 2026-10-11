export const createCorsOptions = (allowedOrigins) => ({
  origin: (origin, callback) => {
    // Requests without an Origin header are non-browser clients (health checks, CLI).
    callback(null, !origin || allowedOrigins.includes(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
