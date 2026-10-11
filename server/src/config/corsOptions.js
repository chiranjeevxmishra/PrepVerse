import cors from 'cors';

export const createCorsOptions = (allowedOrigins) => ({
origin: (origin, callback) => {
// Allow requests without an Origin header (CLI/health checks)
if (!origin || allowedOrigins.includes(origin)) {
return callback(null, true);
}


return callback(new Error(`CORS blocked origin: ${origin}`));


},

credentials: true,

methods: [
'GET',
'POST',
'PUT',
'PATCH',
'DELETE',
'OPTIONS',
],

allowedHeaders: [
'Content-Type',
'Authorization',
],
});
