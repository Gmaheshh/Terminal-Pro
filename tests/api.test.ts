import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../server.ts';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
process.env.ADMIN_USER = process.env.ADMIN_USER || 'admin';
process.env.ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

const startServer = async () => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No address');
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
};

test('health endpoint works', async () => {
  const { server, baseUrl } = await startServer();
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, 'ok');
  server.close();
});

test('protected signals endpoint blocks unauthorized request', async () => {
  const { server, baseUrl } = await startServer();
  const response = await fetch(`${baseUrl}/api/signals/run?ticker=RELIANCE.NS`);
  assert.equal(response.status, 401);
  server.close();
});
