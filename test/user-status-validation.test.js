import test from 'node:test';
import assert from 'node:assert/strict';
import { toggleStatusSchema, updateUserSchema } from '../src/modules/users/user.validation.js';

test('locking requires a nonblank reason and allows unlocking without one', () => {
  assert.equal(toggleStatusSchema.safeParse({ params: { id: 'user-1' }, body: { isActive: false } }).success, false);
  assert.equal(toggleStatusSchema.safeParse({ params: { id: 'user-1' }, body: { isActive: false, reason: '   ' } }).success, false);
  assert.equal(toggleStatusSchema.safeParse({ params: { id: 'user-1' }, body: { isActive: false, reason: 'Nghỉ việc' } }).success, true);
  assert.equal(toggleStatusSchema.safeParse({ params: { id: 'user-1' }, body: { isActive: true } }).success, true);
});

test('ordinary account update cannot bypass the lock reason', () => {
  assert.equal(updateUserSchema.safeParse({ params: { id: 'user-1' }, body: { isActive: false } }).success, false);
});
