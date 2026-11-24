// Request-flow steps for each Child Container and the step state machine. No DOM here.

export const NODES = Object.freeze({
  BROWSER: 'browser',
  DNS: 'dns',
  WEB: 'web',
  DB: 'db',
});

export const CC1_STEPS = Object.freeze([
  {
    id: 1,
    from: NODES.BROWSER,
    to: NODES.DNS,
    title: 'Browser asks DNS for the IP',
    message: 'www.mysite.com ?',
  },
  {
    id: 2,
    from: NODES.DNS,
    to: NODES.BROWSER,
    title: 'DNS returns the IP address',
    message: '15.125.23.214',
    fetch: '/dns/resolve?host=www.mysite.com',
    format: (data) => data.ip,
  },
  {
    id: 3,
    from: NODES.BROWSER,
    to: NODES.WEB,
    title: 'Browser sends HTTP request to the IP',
    message: 'GET /users/12',
  },
  {
    id: 4,
    from: NODES.WEB,
    to: NODES.BROWSER,
    title: 'Web server returns HTML / JSON',
    message: 'JSON',
    fetch: '/api/users/12',
    format: () => '200 OK · JSON',
  },
]);

// CC2: the web tier (Web Server) and the data tier (Database Server) are split.
export const CC2_STEPS = Object.freeze([
  CC1_STEPS[0],
  CC1_STEPS[1],
  CC1_STEPS[2],
  {
    id: 4,
    from: NODES.WEB,
    to: NODES.DB,
    title: 'Web server queries the database',
    message: 'SELECT users id=12',
  },
  {
    id: 5,
    from: NODES.DB,
    to: NODES.WEB,
    title: 'Database returns the rows',
    message: '1 row',
    fetch: '/db/users/12',
    format: (data) => `${data.rowCount} ${data.rowCount === 1 ? 'row' : 'rows'}`,
  },
  {
    id: 6,
    from: NODES.WEB,
    to: NODES.BROWSER,
    title: 'Web server returns HTML / JSON',
    message: 'JSON',
    fetch: '/api/users/12',
    format: () => '200 OK · JSON',
  },
]);

export class Simulation {
  constructor(steps = CC1_STEPS) {
    if (!steps.length) throw new Error('Simulation needs at least one step');
    this.steps = steps;
    this.index = -1;
  }

  get current() {
    return this.index >= 0 ? this.steps[this.index] : null;
  }

  get isDone() {
    return this.index === this.steps.length - 1;
  }

  /** Advance one step; returns the new current step, or null if already done. */
  next() {
    if (this.isDone) return null;
    this.index += 1;
    return this.current;
  }

  reset() {
    this.index = -1;
  }
}
