// Live Earth: the last day's earthquakes (USGS), the ISS (CelesTrak) and the weather at a tapped spot (Open-Meteo).
// Data and markup only; index.html draws it on the globe.
import {dirLL, getJSON} from './engine.js';
import {parseTLE} from './orbit.js';

export const live = {quakes: null, iss: null};

// fetched once per visit; a failure just leaves the layer empty
export function loadLive() {
  if (!live.quakes) {
    live.quakes = [];
    getJSON('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson').then(j => {
      live.quakes = j.features.filter(f => f.properties.mag != null).map(({properties: p, geometry: {coordinates: [lon, lat, depth]}}) =>
        ({mag: p.mag, place: p.place || 'Unnamed location', time: p.time, depth, dir: dirLL(lat, lon), seed: Math.random()}));
    }).catch(e => console.warn('earthquakes unavailable', e));
  }
  if (!live.iss) {
    live.iss = {};
    let cached = null;
    try { const c = JSON.parse(localStorage.getItem('firstlight.issTle')); if (c && Date.now() - c.at < 72e5) cached = c.tle; } catch {}
    // CelesTrak asks clients not to fetch the same set more than every two hours, and answers 503 to addresses that do;
    // wheretheiss.at republishes the same NORAD elements, so it stands in when CelesTrak says no
    const tleFrom = url => getJSON(url, {text: true, timeout: 20000}).then(t => (parseTLE(t), t));   // nobody waits on the orbit: allow a slow first connection
    (cached ? Promise.resolve(cached) : tleFrom('https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=tle')
      .catch(() => tleFrom('https://api.wheretheiss.at/v1/satellites/25544/tles?format=text'))
      .then(tle => { try { localStorage.setItem('firstlight.issTle', JSON.stringify({at: Date.now(), tle})); } catch {} return tle; }))
      .then(tle => { live.iss = {el: parseTLE(tle)}; }).catch(e => console.warn('ISS unavailable', e));
  }
}

export const weatherAt = (lat, lon) => getJSON(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}` +
  '&current=temperature_2m,weather_code,is_day,wind_speed_10m&daily=sunrise,sunset&timezone=auto&forecast_days=1');

const WMO = {0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Freezing fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  56: 'Freezing drizzle', 57: 'Freezing drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain', 71: 'Light snow', 73: 'Snow',
  75: 'Heavy snow', 77: 'Snow grains', 80: 'Rain showers', 81: 'Rain showers', 82: 'Violent showers', 85: 'Snow showers', 86: 'Snow showers', 95: 'Thunderstorm',
  96: 'Thunderstorm, hail', 99: 'Thunderstorm, hail'};
export const esc = s => String(s).replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);
const fmtLL = (lat, lon) => `${Math.abs(lat).toFixed(1)}°${lat < 0 ? 'S' : 'N'} ${Math.abs(lon).toFixed(1)}°${lon < 0 ? 'W' : 'E'}`;
export const localTime = w => w ? new Date(Date.now() + w.utc_offset_seconds * 1e3).toISOString().slice(11, 16) : '';
export const ago = ms => { const m = Math.round((Date.now() - ms) / 6e4); return m < 60 ? `${Math.max(m, 1)} min ago` : `${Math.round(m / 60)} h ago`; };

// the "this place, right now" card; p = {lat, lon, name, sub, wx, err}
export function placeCard(p, arrow) {
  const w = p.wx;
  let body = `<p class="pe">${p.err ? 'Weather is unavailable right now.' : 'Asking the sky…'}</p>`;
  if (w) {
    const c = w.current, rise = w.daily.sunrise[0] || '', set = w.daily.sunset[0] || '';
    const sun = rise === set ? (c.is_day ? 'Midnight sun' : 'Polar night') : `${rise.slice(11, 16)} – ${set.slice(11, 16)}`;   // polar days come back as equal times
    body = '<dl>' + [['Local time', `${localTime(w)} <small>${esc(w.timezone_abbreviation)}</small>`], ['Now', `${Math.round(c.temperature_2m)} °C · ${WMO[c.weather_code] || '–'}`],
      ['Sunrise – sunset', sun], ['Wind', `${Math.round(c.wind_speed_10m)} km/h`]].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('') + '</dl>';
  }
  return `<div class="ph"><div><h3>${esc(p.name)}</h3><span>${p.sub ? esc(p.sub) + ' · ' : ''}${fmtLL(p.lat, p.lon)}</span></div>` +
    `<button class="x" aria-label="Close"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></div>${body}` +
    `<div class="pf"><a href="https://open-meteo.com/" target="_blank" rel="noopener">Weather: Open-Meteo · CC BY 4.0</a><button class="go">Earth's sites ${arrow}</button></div>`;
}
