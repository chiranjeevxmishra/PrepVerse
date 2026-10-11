import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import { startServer } from '../../src/server.js';

const createDependencies = (overrides = {}) => {
  const calls = [];
  const fakeServer = new EventEmitter();
  fakeServer.listen = (port, host) => {
    calls.push(['listen', port, host]);
    queueMicrotask(() => fakeServer.emit('listening'));
    return fakeServer;
  };

  return {
    calls,
    fakeServer,
    dependencies: {
      port: '10000',
      logger: { log: () => {} },
      connect: async () => { calls.push(['connect']); return {}; },
      seed: async () => { calls.push(['seed']); },
      startScheduler: () => { calls.push(['scheduler']); },
      createHttpServer: () => { calls.push(['create-server']); return fakeServer; },
      attachSockets: (server) => { calls.push(['attach-sockets', server]); },
      ...overrides,
    },
  };
};

test('startup connects and seeds before binding on Render host and port', async () => {
  const { calls, fakeServer, dependencies } = createDependencies();

  const server = await startServer(dependencies);

  assert.equal(server, fakeServer);
  assert.deepEqual(calls.map(([name]) => name), [
    'connect', 'seed', 'scheduler', 'create-server', 'attach-sockets', 'listen',
  ]);
  assert.deepEqual(calls.at(-1), ['listen', '10000', '0.0.0.0']);
});

test('database rejection prevents seeding and listening', async () => {
  const { calls, dependencies } = createDependencies({
    connect: async () => { calls.push(['connect']); throw new Error('database unavailable'); },
  });

  await assert.rejects(startServer(dependencies), /database unavailable/);
  assert.deepEqual(calls.map(([name]) => name), ['connect']);
});

test('missing database connection prevents listening', async () => {
  const { calls, dependencies } = createDependencies({
    connect: async () => { calls.push(['connect']); return null; },
  });

  await assert.rejects(startServer(dependencies), /Database initialization did not complete/);
  assert.deepEqual(calls.map(([name]) => name), ['connect']);
});

test('bind errors reject with the error code and without the underlying message', async () => {
  const { fakeServer, dependencies } = createDependencies();
  fakeServer.listen = () => {
    queueMicrotask(() => {
      const error = new Error('bind failed for secret connection details');
      error.code = 'EADDRINUSE';
      fakeServer.emit('error', error);
    });
  };

  await assert.rejects(startServer(dependencies), (error) => {
    assert.match(error.message, /EADDRINUSE/);
    assert.doesNotMatch(error.message, /secret connection details/);
    return true;
  });
});
