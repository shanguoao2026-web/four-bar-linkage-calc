import test from 'node:test';
import assert from 'node:assert/strict';
import { runCli } from '../dist/command.js';
import { classify } from '../dist/linkage.js';

const base = { ground: 100, crank: 40, coupler: 90, rocker: 80 };
const cli = (...args) => {
  let stdout = '', stderr = '';
  const status = runCli(args, text => { stdout += text + '\n'; }, text => { stderr += text + '\n'; });
  return { status, stdout, stderr };
};
const flags = (lengths = base) => Object.entries(lengths).flatMap(([key, value]) => [`--${key}`, String(value)]);

test('specified crank-rocker values and transmission angles', () => {
  const r = classify(base);
  assert.equal(r.s_plus_l, 140);
  assert.equal(r.p_plus_q, 170);
  assert.equal(r.grashof, true);
  assert.equal(r.changePoint, false);
  assert.equal(r.classification, 'crank-rocker');
  assert.equal(r.transmission.mu_min.toFixed(2), '40.80');
  assert.equal(r.transmission.mu_max.toFixed(2), '110.74');
  assert.deepEqual(r.warnings, []);
});

test('all classifications and input rotation eligibility', () => {
  for (const [lengths, expected, full] of [
    [{ ground: 40, crank: 100, coupler: 90, rocker: 80 }, 'double-crank', true],
    [{ ground: 100, crank: 90, coupler: 40, rocker: 80 }, 'double-rocker', false],
    [{ ground: 100, crank: 90, coupler: 80, rocker: 40 }, 'crank-rocker', false],
    [{ ground: 100, crank: 70, coupler: 80, rocker: 60 }, 'triple-rocker', false]
  ]) {
    const r = classify(lengths);
    assert.equal(r.classification, expected);
    assert.equal(r.inputFullRotation, full);
    assert.equal(r.transmission !== null, full);
  }
});

test('change points, tied shortest links, and low angle warnings', () => {
  const r = classify({ ground: 100, crank: 40, coupler: 80, rocker: 60 });
  assert.equal(r.grashof, true);
  assert.equal(r.changePoint, true);
  assert.ok(Math.abs(r.transmission.mu_max - 180) < 0.00001);
  assert.deepEqual(r.warnings, []);
  const tied = classify({ ground: 50, crank: 50, coupler: 50, rocker: 50 });
  assert.equal(tied.shortestLink, 'ground');
  assert.equal(tied.classification, 'double-crank');
  assert.equal(tied.transmission.mu_min, 0);
  assert.equal(tied.warnings.length, 1);
});

test('reject invalid and non-assemblable lengths, including boundary', () => {
  for (const crank of [0, -1, NaN, Infinity, -Infinity]) {
    assert.throws(() => classify({ ...base, crank }), /finite positive/);
  }
  for (const ground of [30, 100]) {
    assert.throws(() => classify({ ground, crank: 10, coupler: 10, rocker: 10 }), /not assemblable/);
  }
});

test('angles and classification are independent of length units', () => {
  for (const scale of [1e-100, 0.001, 1e100]) {
    const r = classify(Object.fromEntries(Object.entries(base).map(([k, v]) => [k, v * scale])));
    assert.equal(r.classification, 'crank-rocker');
    assert.ok(Math.abs(r.transmission.mu_min - 40.804437690619295) < 1e-10);
  }
});

test('CLI table, JSON, help and warnings', () => {
  const table = cli(...flags());
  assert.equal(table.status, 0, table.stderr);
  assert.match(table.stdout, /s\+l\s+\| 140/);
  assert.match(table.stdout, /p\+q\s+\| 170/);
  assert.match(table.stdout, /Grashof\s+\| yes/);
  assert.match(table.stdout, /crank-rocker/);
  assert.match(table.stdout, /40\.80 deg/);
  assert.match(table.stdout, /110\.74 deg/);
  const json = cli('--json', ...flags());
  assert.equal(json.status, 0, json.stderr);
  assert.deepEqual(JSON.parse(json.stdout), classify(base));
  assert.equal(cli('--help').status, 0);
  assert.match(cli('--help').stdout, /Usage:/);
  const warning = cli(...flags({ ground: 100, crank: 40, coupler: 80, rocker: 60 }));
  assert.match(warning.stdout, /change point/);
  assert.match(cli(...flags({ ground: 50, crank: 50, coupler: 50, rocker: 50 })).stdout, /WARN/);
  const noAngles = cli(...flags({ ground: 100, crank: 90, coupler: 40, rocker: 80 }));
  assert.match(noAngles.stdout, /mu_min\s+\| N\/A/);
});

test('CLI errors exit 1 without emitting result data', () => {
  for (const args of [
    [], ['--unknown'], ['--ground'], ['--ground', '--json'],
    [...flags(), '--crank', '50'], [...flags(), '--json', '--json'],
    ...['0', '-5', 'NaN', 'Infinity', 'abc', '0x10', '1e999', ''].map(v => ['--ground', v, '--crank', '40', '--coupler', '90', '--rocker', '80']),
    flags({ ground: 100, crank: 10, coupler: 10, rocker: 10 })
  ]) {
    const r = cli(...args);
    assert.equal(r.status, 1, JSON.stringify(args));
    assert.match(r.stderr, /^Error:/);
    assert.equal(r.stdout, '');
  }
});
