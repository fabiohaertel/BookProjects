// Simulated data tier (CC2). It lives apart from the web tier so the two can be
// scaled independently. The web tier only reads data through this module.

const TABLES = Object.freeze({
  users: Object.freeze({
    12: { id: 12, firstName: 'John', lastName: 'Smith', address: { streetAddress: '21 2nd Street', city: 'New York', state: 'NY', postalCode: 10021 }, phoneNumbers: ['212 555-1234', '646 555-4567'] },
  }),
});

/**
 * Select one row by primary key, shaped like a database driver result.
 * @returns {{ query: string, rowCount: number, rows: object[] }}
 */
export function selectById(table, id) {
  const rows = TABLES[table] ?? {};
  const row = rows[id];
  return {
    query: `SELECT * FROM ${table} WHERE id = ${id}`,
    rowCount: row ? 1 : 0,
    rows: row ? [structuredClone(row)] : [],
  };
}

export function findUserById(id) {
  return selectById('users', id).rows[0] ?? null;
}
