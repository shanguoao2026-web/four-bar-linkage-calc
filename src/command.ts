import { classify, type Lengths } from './linkage.js';

const help = `Usage: four-bar-linkage-calc --ground d --crank a --coupler b --rocker c [--json]

Classify a planar four-bar linkage. Use any consistent length unit.
  --ground d    Fixed link length
  --crank a     Input link length (may not permit full rotation)
  --coupler b   Coupler link length
  --rocker c    Output link length
  --json        Emit structured JSON instead of a table
  --help        Show this help

All lengths must be finite and positive. The longest link must be
strictly shorter than the sum of the other three.
`;

function main(args: string[], stdout: (text: string) => void) {
  if (args.includes('--help')) {
    stdout(help.trimEnd());
    return;
  }
  const lengths: Partial<Lengths> = {};
  let json = false;
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (flag === '--json') {
      if (json) throw new Error('Duplicate option --json');
      json = true;
      continue;
    }
    if (!['--ground', '--crank', '--coupler', '--rocker'].includes(flag)) {
      throw new Error(`Unknown option: ${flag}`);
    }
    const key = flag.slice(2) as keyof Lengths;
    if (lengths[key] !== undefined) throw new Error(`Duplicate option ${flag}`);
    const value = args[++i];
    if (value === undefined || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) {
      throw new Error(`Invalid number for ${flag}: ${value}`);
    }
    lengths[key] = Number(value);
  }
  for (const key of ['ground', 'crank', 'coupler', 'rocker'] as const) {
    if (lengths[key] === undefined) throw new Error(`Missing required option --${key}`);
  }
  const result = classify(lengths as Lengths);
  if (json) {
    stdout(JSON.stringify(result, null, 2));
    return;
  }
  const rows = [
    ['Ground (d)', result.lengths.ground],
    ['Input (a)', result.lengths.crank],
    ['Coupler (b)', result.lengths.coupler],
    ['Output (c)', result.lengths.rocker],
    ['s+l', result.s_plus_l], ['p+q', result.p_plus_q],
    ['Grashof', `${result.grashof ? 'yes' : 'no'}${result.changePoint ? ' (change point)' : ''}`],
    ['Classification', result.classification],
    ['Input full rotation', result.inputFullRotation ? 'yes' : 'no'],
    ['mu_min', result.transmission ? `${result.transmission.mu_min.toFixed(2)} deg` : 'N/A'],
    ['mu_max', result.transmission ? `${result.transmission.mu_max.toFixed(2)} deg` : 'N/A']
  ];
  stdout(rows.map(([label, value]) => `${String(label).padEnd(20)} | ${value}`).join('\n'));
  for (const warning of result.warnings) stdout(warning);
}

export function runCli(
  args: string[],
  stdout: (text: string) => void = console.log,
  stderr: (text: string) => void = console.error
): number {
  try {
    main(args, stdout);
    return 0;
  } catch (error) {
    stderr(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}
