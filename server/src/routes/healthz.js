export const createHealthzHandler = (getDatabaseStatus) => (req, res) => {
  const databaseReady = getDatabaseStatus() === 'connected';
  return res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? 'ok' : 'not_ready',
  });
};
