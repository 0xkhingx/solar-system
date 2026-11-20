// Where a satellite is, from its two-line element set (TLE).
// shortcut: two-body Kepler orbit plus J2 drift of the node and perigee, not full SGP4. Good to tens of km for
// a day or two after the TLE epoch, plenty at globe scale; use satellite.js (SGP4) if this ever needs to be exact.
const MU = 398600.4418, RE = 6378.137, J2 = 1.08262668e-3, DEG = Math.PI / 180, J2000 = Date.UTC(2000, 0, 1, 12);

export function parseTLE(text) {
  const lines = text.trim().split(/\r?\n/).map(l => l.trimEnd());
  const i = lines.findIndex(l => l.startsWith('1 ')), l1 = lines[i], l2 = lines[i + 1];
  if (!l1 || !l2 || !l2.startsWith('2 ')) throw new Error('not a TLE');
  const yy = +l1.slice(18, 20), day = +l1.slice(20, 32);
  return {
    name: (lines[i - 1] || '').trim(),
    epoch: Date.UTC(yy < 57 ? 2000 + yy : 1900 + yy, 0, 1) + (day - 1) * 864e5,
    inc: +l2.slice(8, 16) * DEG, raan: +l2.slice(17, 25) * DEG, ecc: +('.' + l2.slice(26, 33)),
    argp: +l2.slice(34, 42) * DEG, M: +l2.slice(43, 51) * DEG, n: +l2.slice(52, 63) * 2 * Math.PI / 86400   // rad/s
  };
}

// {lat, lon (degrees), alt (km)} at a JS Date or ms timestamp
export function satPos(el, when) {
  const t = (+when - el.epoch) / 1000, a = Math.cbrt(MU / (el.n * el.n)), e = el.ecc, p = a * (1 - e * e);
  const k = 1.5 * el.n * J2 * (RE / p) ** 2, ci = Math.cos(el.inc);
  const raan = el.raan - k * ci * t, argp = el.argp + k * (2.5 * ci * ci - .5) * t;
  let M = (el.M + el.n * t) % (2 * Math.PI), E = M;
  for (let j = 0; j < 8; j++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2)), r = a * (1 - e * Math.cos(E));
  const u = argp + nu, cu = Math.cos(u), su = Math.sin(u), cO = Math.cos(raan), sO = Math.sin(raan), si = Math.sin(el.inc);
  const x = r * (cO * cu - sO * su * ci), y = r * (sO * cu + cO * su * ci), z = r * su * si;
  const gmst = (280.46061837 + 360.98564736629 * (+when - J2000) / 864e5) * DEG;
  const lon = ((Math.atan2(y, x) - gmst) / DEG % 360 + 540) % 360 - 180;
  return {lat: Math.asin(z / r) / DEG, lon, alt: r - RE};
}
