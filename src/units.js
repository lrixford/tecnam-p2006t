export const LB_PER_KG = 2.20462262;
export const GAL_PER_L = 0.264172052;
export const FT_PER_M  = 3.28083990;
export const LB_FT_PER_KG_M = LB_PER_KG * FT_PER_M;  // 7.23301385

export const lbToKg     = (lb) => lb / LB_PER_KG;
export const kgToLb     = (kg) => kg * LB_PER_KG;
export const galToL     = (gal) => gal / GAL_PER_L;
export const lToGal     = (l) => l * GAL_PER_L;
export const ftToM      = (ft) => ft / FT_PER_M;
export const mToFt      = (m)  => m * FT_PER_M;
export const lbFtToKgM  = (lbFt) => lbFt / LB_FT_PER_KG_M;
export const kgMToLbFt  = (kgM)  => kgM * LB_FT_PER_KG_M;

export function formatNumber(value, decimals = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  return Number(value).toFixed(decimals);
}

export function parseNumber(input) {
  if (input === '' || input === null || input === undefined) return 0;
  const n = Number(input);
  return Number.isFinite(n) ? n : 0;
}
