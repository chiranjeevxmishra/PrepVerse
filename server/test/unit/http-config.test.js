import assert from 'node:assert/strict';
import cors from 'cors';
import test from 'node:test';
import { createCorsOptions } from '../../src/config/corsOptions.js';
import { createHealthzHandler } from '../../src/routes/healthz.js';

const productionOrigin = 'https://prep-verse-six.vercel.app';
const corsOptions = createCorsOptions([productionOrigin, 'http://localhost:5173']);

const runPreflight = (origin) => {
  const headers = new Map();
  const response = {
    statusCode: 200,
    setHeader(name, value) { headers.set(name.toLowerCase(), value); },
    getHeader(name) { return headers.get(name.toLowerCase()); },
    end() { this.ended = true; },
  };
  const request = {
    method: 'OPTIONS',
    headers: {
      origin,
      'access-control-request-method': 'POST',
      'access-control-request-headers': 'authorization,content-type',
    },
  };
  let nextCalled = false;
  cors(corsOptions)(request, response, (error) => {
    if (error) throw error;
    nextCalled = true;
  });
  return { headers, response, nextCalled };
};

test('production frontend preflight allows credentialed login headers and method', () => {
  const { headers, response, nextCalled } = runPreflight(productionOrigin);

  assert.equal(nextCalled, false);
  assert.equal(response.statusCode, 204);
  assert.equal(response.ended, true);
  assert.equal(headers.get('access-control-allow-origin'), productionOrigin);
  assert.equal(headers.get('access-control-allow-credentials'), 'true');
  assert.match(headers.get('access-control-allow-methods'), /POST/);
  assert.match(headers.get('access-control-allow-headers'), /authorization/i);
  assert.match(headers.get('access-control-allow-headers'), /content-type/i);
});

test('unlisted frontend origin receives no CORS permission', () => {
  const { headers, nextCalled } = runPreflight('https://untrusted.example');

  assert.equal(nextCalled, true);
  assert.equal(headers.has('access-control-allow-origin'), false);
});

test('health endpoint reports connected and disconnected database states', () => {
  const makeResponse = () => ({
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  });

  let response = makeResponse();
  createHealthzHandler(() => 'connected')({}, response);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { status: 'ok' });

  response = makeResponse();
  createHealthzHandler(() => 'disconnected')({}, response);
  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.body, { status: 'not_ready' });
});
