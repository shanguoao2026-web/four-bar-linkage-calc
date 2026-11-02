export interface Lengths {
  ground: number;
  crank: number;
  coupler: number;
  rocker: number;
}

export function classify(lengths: Lengths) {
  for (const key of ['ground', 'crank', 'coupler', 'rocker'] as const) {
    if (!Number.isFinite(lengths[key]) || lengths[key] <= 0) {
      throw new Error(`${key} must be a finite positive number`);
    }
  }
  const sorted = Object.values(lengths).sort((a, b) => a - b);
  const [s, p, q, l] = sorted;
  // Normalize before comparisons and squaring to avoid overflow/underflow.
  const [sn, pn, qn] = [s / l, p / l, q / l];
  if (1 >= sn + pn + qn) {
    throw new Error('Linkage is not assemblable: longest link must be less than the sum of the other three');
  }
  const grashof = sn + 1 <= pn + qn;
  const changePoint = sn + 1 === pn + qn;
  const shortestLink = (['ground', 'crank', 'rocker', 'coupler'] as const)
    .find(key => lengths[key] === s)!;
  const classification = !grashof ? 'triple-rocker'
    : shortestLink === 'ground' ? 'double-crank'
    : shortestLink === 'coupler' ? 'double-rocker' : 'crank-rocker';
  const inputFullRotation = grashof && (shortestLink === 'ground' || shortestLink === 'crank');
  let transmission: { mu_min: number; mu_max: number } | null = null;
  if (inputFullRotation) {
    const a = lengths.crank / l, b = lengths.coupler / l;
    const c = lengths.rocker / l, d = lengths.ground / l;
    const angle = (cosine: number) => Math.acos(Math.max(-1, Math.min(1, cosine))) * 180 / Math.PI;
    transmission = {
      mu_min: angle((b * b + c * c - (a - d) ** 2) / (2 * b * c)),
      mu_max: angle((b * b + c * c - (a + d) ** 2) / (2 * b * c))
    };
  }
  return {
    lengths: { ...lengths },
    shortestLink,
    s_plus_l: s + l,
    p_plus_q: p + q,
    grashof,
    changePoint,
    classification,
    inputFullRotation,
    transmission,
    warnings: transmission && transmission.mu_min < 40
      ? ['WARN: mu_min is below 40 deg'] : []
  };
}
