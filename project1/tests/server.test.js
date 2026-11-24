import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/server/app.js';

const app = createApp();

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /dns/resolve', () => {
  it('resolves a known host to its IP', async () => {
    const res = await request(app).get('/dns/resolve').query({ host: 'www.mysite.com' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ host: 'www.mysite.com', ip: '15.125.23.214' });
  });

  it('is case-insensitive', async () => {
    const res = await request(app).get('/dns/resolve').query({ host: 'WWW.MySite.com' });
    expect(res.status).toBe(200);
    expect(res.body.ip).toBe('15.125.23.214');
  });

  it('returns 400 when host is missing', async () => {
    const res = await request(app).get('/dns/resolve');
    expect(res.status).toBe(400);
  });

  it('returns 404 for an unknown host', async () => {
    const res = await request(app).get('/dns/resolve').query({ host: 'unknown.com' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/users/:id', () => {
  it('returns the user as JSON', async () => {
    const res = await request(app).get('/api/users/12');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toMatchObject({ id: 12, firstName: 'John', lastName: 'Smith' });
  });

  it('returns 404 for an unknown user', async () => {
    const res = await request(app).get('/api/users/999');
    expect(res.status).toBe(404);
  });
});

describe('GET /db/users/:id (database server)', () => {
  it('returns the row in a query result', async () => {
    const res = await request(app).get('/db/users/12');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ query: 'SELECT * FROM users WHERE id = 12', rowCount: 1 });
    expect(res.body.rows[0]).toMatchObject({ id: 12, firstName: 'John' });
  });

  it('returns an empty result for an unknown user', async () => {
    const res = await request(app).get('/db/users/999');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ rowCount: 0, rows: [] });
  });

  it('returns 400 for an invalid id', async () => {
    for (const id of ['abc', '0', '-3', '1.5']) {
      const res = await request(app).get(`/db/users/${id}`);
      expect(res.status).toBe(400);
    }
  });

  it('web tier returns the same user the data tier holds', async () => {
    const [web, db] = await Promise.all([
      request(app).get('/api/users/12'),
      request(app).get('/db/users/12'),
    ]);
    expect(web.body).toEqual(db.body.rows[0]);
  });
});

describe('static frontend', () => {
  it('serves index.html at /', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('id="cc1"');
    expect(res.text).toContain('id="cc2"');
    expect(res.text).toContain('data-node="db"');
  });

  it('serves the JS modules', async () => {
    const res = await request(app).get('/js/main.js');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/javascript/);
  });

  it('returns JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});
