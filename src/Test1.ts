import assert from 'node:assert/strict';
import test from 'node:test';
import { utils } from './Utils';

test('utils.add returns the sum of two numbers', () => {
    assert.equal(utils.add(2, 3), 5);
    assert.equal(utils.add(2, 2), 4);
});
