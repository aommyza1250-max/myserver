const assert = require('node:assert/strict');
const { once } = require('node:events');
const { after, before, test } = require('node:test');
const app = require('../dist/index.js').default;

let server;
let baseUrl;

before(async () => {
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    if (server?.listening) {
        await new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    }
});

test('health endpoint returns service and database status', async () => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
    assert.ok(['connected', 'disconnected'].includes(body.database));
});

test('public index page is served at the root URL', async () => {
    const response = await fetch(`${baseUrl}/`);
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(body, /เพิ่มข้อมูลผู้ใช้|เพิ่มผู้ใช้|user/i);
});

test('API rejects incomplete user data before accessing the database', async () => {
    const response = await fetch(`${baseUrl}/api/users`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Test User' }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, 'email is required');
});

test('unknown routes return a JSON 404 response', async () => {
    const response = await fetch(`${baseUrl}/api/unknown`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.message, 'Route not found');
});
