# Four-bar linkage calculator

A TypeScript CLI for Node.js 18 or newer. No runtime dependencies; development
uses TypeScript and Node type definitions. Tests use `node:test`.

```sh
npm install
npm test
node dist/cli.js --ground 100 --crank 40 --coupler 90 --rocker 80
```

The default table includes:

```text
s+l                  | 140
p+q                  | 170
Grashof              | yes
Classification       | crank-rocker
Input full rotation  | yes
mu_min               | 40.80 deg
mu_max               | 110.74 deg
```

Use any consistent length unit. `--crank` names the input link and `--rocker`
names the output link even when the classification does not permit their full
rotation. All four lengths are required, finite, and strictly positive. The
longest link must be strictly shorter than the sum of the other three; invalid
input prints an error to stderr and exits with status 1.

```sh
# JSON with numeric angles in degrees (unrounded)
node dist/cli.js --ground 100 --crank 40 --coupler 90 --rocker 80 --json
# Shortest ground: double-crank
node dist/cli.js --ground 40 --crank 100 --coupler 90 --rocker 80
# Shortest coupler: double-rocker
node dist/cli.js --ground 100 --crank 90 --coupler 40 --rocker 80
# Non-assemblable: exits 1
node dist/cli.js --ground 100 --crank 10 --coupler 10 --rocker 10
node dist/cli.js --help
```

`npm run build` compiles to `dist/`; `npm start -- <options>` runs the built CLI.
The package also exposes the `classify(lengths)` function with TypeScript types.

Grashof's condition is `s+l <= p+q`, with lengths sorted as `s <= p <= q <= l`.
Equality is reported as a **change point**, where the linkage can become
collinear and singular. For a Grashof linkage, shortest ground gives
double-crank, shortest input or output gives crank-rocker, and shortest coupler
gives double-rocker. Non-Grashof linkages are triple-rockers. Ties for shortest
are resolved in the order ground, input, output, coupler; change-point results
retain the nominal classification despite singular positions.

Transmission angle extrema are reported only when the input permits full
rotation (Grashof with ground or input shortest). With ground `d`, input `a`,
coupler `b`, and output `c`, the formula is
`cos(mu) = (b²+c²-a²-d² ± 2ad)/(2bc)`. Angles use the 0–180 degree convention;
the plus sign gives `mu_min` and the minus sign gives `mu_max`. Tables round to
two decimals. `mu_min < 40°` produces a WARN message. Otherwise, unavailable
angles appear as N/A in tables and `transmission: null` in JSON. JSON includes
`grashof`, `changePoint`, `classification`, `inputFullRotation`, `s_plus_l`,
`p_plus_q`, and a `warnings` array alongside the lengths and shortest link.

Licensed under MIT; see [LICENSE](LICENSE).
