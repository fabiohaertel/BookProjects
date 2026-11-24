import { Diagram } from './diagram.js';
import { Simulation, CC1_STEPS, CC2_STEPS, NODES } from './simulation.js';

/**
 * Wire one Child Container: diagram, controls, step list and response panel.
 * Nodes are found by their `data-node` attribute inside the section's `.diagram`.
 */
function setupChildContainer(section, { steps, connections }) {
  const root = section.querySelector('.diagram');
  const nodes = {};
  for (const el of root.querySelectorAll('[data-node]')) nodes[el.dataset.node] = el;

  const diagram = new Diagram(root, root.querySelector('canvas'), nodes, connections);
  const simulation = new Simulation(steps);
  const stepsList = section.querySelector('.steps');
  const responseBox = section.querySelector('.response');
  const buttons = {
    run: section.querySelector('[data-action="run"]'),
    next: section.querySelector('[data-action="next"]'),
    reset: section.querySelector('[data-action="reset"]'),
  };
  let busy = false;

  for (const step of steps) {
    const li = document.createElement('li');
    li.dataset.step = step.id;
    const title = document.createElement('span');
    title.className = 'step-title';
    title.textContent = step.title;
    const code = document.createElement('code');
    code.textContent = step.message;
    li.append(title, code);
    stepsList.append(li);
  }

  function highlightStep(id) {
    for (const li of stepsList.children) {
      const n = Number(li.dataset.step);
      li.classList.toggle('active', n === id);
      li.classList.toggle('done', id !== null && n < id);
    }
  }

  function updateButtons() {
    buttons.run.disabled = busy;
    buttons.next.disabled = busy || simulation.isDone;
    buttons.reset.disabled = busy;
  }

  async function resolveLabel(step) {
    if (!step.fetch) return step.message;
    try {
      const res = await fetch(step.fetch);
      const data = await res.json();
      responseBox.textContent = `GET ${step.fetch}  →  ${res.status}\n${JSON.stringify(data, null, 2)}`;
      return res.ok ? step.format(data) : `${res.status} error`;
    } catch (err) {
      responseBox.textContent = `GET ${step.fetch} failed: ${err.message}`;
      return 'network error';
    }
  }

  async function playNext() {
    const step = simulation.next();
    if (!step) return;
    highlightStep(step.id);
    const label = await resolveLabel(step);
    await diagram.animateStep(step, label);
  }

  function reset() {
    simulation.reset();
    diagram.clear();
    highlightStep(null);
    responseBox.textContent = 'Responses from the server will appear here.';
  }

  async function withBusy(fn) {
    busy = true;
    updateButtons();
    try {
      await fn();
    } finally {
      busy = false;
      updateButtons();
    }
  }

  buttons.next.addEventListener('click', () => withBusy(playNext));
  buttons.run.addEventListener('click', () =>
    withBusy(async () => {
      reset();
      while (!simulation.isDone) {
        await playNext();
        await new Promise((r) => setTimeout(r, 400));
      }
    }),
  );
  buttons.reset.addEventListener('click', () => {
    reset();
    updateButtons();
  });

  reset();
  updateButtons();
}

setupChildContainer(document.querySelector('#cc1'), {
  steps: CC1_STEPS,
  connections: [
    [NODES.BROWSER, NODES.DNS],
    [NODES.BROWSER, NODES.WEB],
  ],
});

setupChildContainer(document.querySelector('#cc2'), {
  steps: CC2_STEPS,
  connections: [
    [NODES.BROWSER, NODES.DNS],
    [NODES.BROWSER, NODES.WEB],
    [NODES.WEB, NODES.DB],
  ],
});
