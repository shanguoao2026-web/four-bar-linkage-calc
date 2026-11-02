# four-bar-linkage-calc

Build a small TypeScript Node CLI (Node 18+, no runtime deps; devDeps typescript + @types/node only; tests with node:test) that classifies a planar four-bar linkage.

Features:
- Inputs (any consistent length unit): --ground d, --crank a (input link), --coupler b, --rocker c (output link).
- Validate: all positive; the linkage must be assemblable (longest link < sum of the other three), else error exit 1.
- Grashof check: s + l <= p + q (report s+l, p+q, Grashof yes/no; equality = "change point").
- Classification: Grashof + shortest is ground → double-crank; shortest is crank/rocker (adjacent to ground) → crank-rocker; shortest is coupler → double-rocker; non-Grashof → triple-rocker.
- Transmission angle extremes when the input link is a full-rotation crank: cos mu = (b^2 + c^2 - a^2 - d^2 ± 2ad)/(2bc); report mu_min, mu_max in degrees, WARN if mu_min < 40 deg.
- Table output by default, --json, --help. README with examples, MIT LICENSE (author shanguoao2026-web), .gitignore with node_modules/ dist/ *.log.
- npm test must build and pass. No secrets, no personal info.

Check values: ground 100 crank 40 coupler 90 rocker 80 → s+l 140, p+q 170, Grashof, crank-rocker, mu_min 40.80 deg, mu_max 110.74 deg. ground 40 crank 100 coupler 90 rocker 80 → double-crank. ground 100 crank 90 coupler 40 rocker 80 → double-rocker. 100,10,10,10 style non-assemblable → error.
