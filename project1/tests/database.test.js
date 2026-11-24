import { describe, it, expect } from 'vitest';
import { selectById, findUserById } from '../src/server/db/database.js';

describe('selectById', () => {
  it('returns one row and the query for a known id', () => {
    const result = selectById('users', 12);
    expect(result.query).toBe('SELECT * FROM users WHERE id = 12');
    expect(result.rowCount).toBe(1);
    expect(result.rows[0].id).toBe(12);
  });

  it('returns no rows for an unknown id or table', () => {
    expect(selectById('users', 999)).toMatchObject({ rowCount: 0, rows: [] });
    expect(selectById('orders', 12)).toMatchObject({ rowCount: 0, rows: [] });
  });

  it('returns copies, so callers cannot change the stored data', () => {
    selectById('users', 12).rows[0].firstName = 'Changed';
    expect(findUserById(12).firstName).toBe('John');
  });
});

describe('findUserById', () => {
  it('returns null for an unknown user', () => {
    expect(findUserById(999)).toBeNull();
  });
});
