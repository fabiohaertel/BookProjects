import { describe, it, expect } from 'vitest';
import { Simulation, CC1_STEPS, CC2_STEPS, NODES } from '../src/public/js/simulation.js';
import { DNS_RECORDS } from '../src/server/routes/dns.js';

describe('CC1_STEPS', () => {
  it('follows the single-server request flow from the book', () => {
    expect(CC1_STEPS.map((s) => [s.from, s.to])).toEqual([
      [NODES.BROWSER, NODES.DNS],
      [NODES.DNS, NODES.BROWSER],
      [NODES.BROWSER, NODES.WEB],
      [NODES.WEB, NODES.BROWSER],
    ]);
  });

  it('formats the DNS response as the resolved IP', () => {
    const dnsStep = CC1_STEPS[1];
    expect(dnsStep.format({ host: 'www.mysite.com', ip: '1.2.3.4' })).toBe('1.2.3.4');
  });

  it('uses the same default IP as the simulated DNS table', () => {
    expect(CC1_STEPS[1].message).toBe(DNS_RECORDS['www.mysite.com']);
  });
});

describe('CC2_STEPS', () => {
  it('adds the web server <-> database round trip before the response', () => {
    expect(CC2_STEPS.map((s) => [s.from, s.to])).toEqual([
      [NODES.BROWSER, NODES.DNS],
      [NODES.DNS, NODES.BROWSER],
      [NODES.BROWSER, NODES.WEB],
      [NODES.WEB, NODES.DB],
      [NODES.DB, NODES.WEB],
      [NODES.WEB, NODES.BROWSER],
    ]);
  });

  it('numbers the steps 1 to 6', () => {
    expect(CC2_STEPS.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('formats the database result as a row count', () => {
    const dbStep = CC2_STEPS.find((s) => s.from === NODES.DB);
    expect(dbStep.fetch).toBe('/db/users/12');
    expect(dbStep.format({ rowCount: 1 })).toBe('1 row');
    expect(dbStep.format({ rowCount: 0 })).toBe('0 rows');
  });

  it('runs through a Simulation to the end', () => {
    const sim = new Simulation(CC2_STEPS);
    let count = 0;
    while (sim.next()) count += 1;
    expect(count).toBe(6);
  });
});

describe('Simulation', () => {
  it('starts before the first step', () => {
    const sim = new Simulation();
    expect(sim.current).toBeNull();
    expect(sim.isDone).toBe(false);
  });

  it('advances through every step and then stops', () => {
    const sim = new Simulation();
    const ids = [];
    let step;
    while ((step = sim.next())) ids.push(step.id);
    expect(ids).toEqual([1, 2, 3, 4]);
    expect(sim.isDone).toBe(true);
    expect(sim.next()).toBeNull();
  });

  it('reset returns to the initial state', () => {
    const sim = new Simulation();
    sim.next();
    sim.next();
    sim.reset();
    expect(sim.current).toBeNull();
    expect(sim.next().id).toBe(1);
  });

  it('rejects an empty step list', () => {
    expect(() => new Simulation([])).toThrow();
  });
});
