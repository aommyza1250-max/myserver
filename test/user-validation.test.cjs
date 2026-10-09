const assert = require('node:assert/strict');
const test = require('node:test');
const User = require('../dist/User.js').default;
const { parseUserInput } = require('../dist/UserValidation.js');

test('create input requires name, email, and password', () => {
    const result = parseUserInput({ name: 'Aom', email: 'aom@example.com' }, false);

    assert.equal(result.error, 'password is required');
});

test('create input trims name and email and keeps the password as entered', () => {
    const result = parseUserInput(
        { name: '  Aom  ', email: '  aom@example.com  ', password: ' pass word ' },
        false,
    );

    assert.deepEqual(result.data, {
        name: 'Aom',
        email: 'aom@example.com',
        password: ' pass word ',
    });
});

test('input rejects a malformed email address', () => {
    const result = parseUserInput({ name: 'Aom', email: 'not-an-email', password: 'secret' }, false);

    assert.equal(result.error, 'email must be a valid email address');
});

test('input rejects unsupported fields', () => {
    const result = parseUserInput({ name: 'Aom', email: 'aom@example.com', password: 'secret', role: 'admin' }, false);

    assert.equal(result.error, 'Unsupported field: role');
});

test('partial update requires at least one field', () => {
    const result = parseUserInput({}, true);

    assert.equal(result.error, 'Provide at least one field to update');
});

test('user JSON never includes the password or password hash', () => {
    const user = new User({
        name: 'Aom Test',
        email: 'aom.test@example.com',
        password: 'sensitive-password',
    });

    const serialized = JSON.stringify(user);

    assert.equal(serialized.includes('password'), false);
    assert.equal(serialized.includes('sensitive-password'), false);
});
