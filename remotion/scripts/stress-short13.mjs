// Stress test for Short13Contract's VO-driven cues.
//   node scripts/stress-short13.mjs [--runs=500]
// Compiles the REAL composition module (esbuild) with a mocked ./vo.gen, then replays it under
// many plausible voice timings (what gen_voice.py could write back) and asserts that every cue
// still lands inside its scene with room to animate, in narration order.
import { build } from 'esbuild';
import { readFileSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import { mkdirSync } from 'fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUNS = Number((process.argv.find((a) => a.startsWith('--runs=')) || '--runs=500').split('=')[1]);
const beats = JSON.parse(readFileSync(path.join(root, '..', 'shorts', 'short-13-contract', 'beats.json'), 'utf8'));
const TOTAL = beats.format.durationSec;
const FPS = beats.format.fps;
const BASE = beats.vo.map(({ text, start, end }) => ({ text, start, end }));
const MIN_ROOM = 10; // frames a cue needs before its scene ends (enter animations are 8–12f)

// ---- compile the composition once; VO is read from globalThis so each scenario can swap it
// built inside the project (out/ is gitignored) so node_modules resolve
const tmp = path.join(root, 'out', 'stress');
mkdirSync(tmp, { recursive: true });
const out = path.join(tmp, 'short13.mjs');
await build({
  entryPoints: [path.join(root, 'src', 'shots', 'short-13', 'Short13Contract.tsx')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  logLevel: 'error',
  packages: 'external',
  jsx: 'automatic',
  plugins: [
    {
      name: 'mocks',
      setup(b) {
        b.onResolve({ filter: /^\.\/vo\.gen$/ }, () => ({ path: 'vo', namespace: 'mock' }));
        b.onResolve({ filter: /\/fonts$/ }, () => ({ path: 'fonts', namespace: 'mock' }));
        b.onLoad({ filter: /^vo$/, namespace: 'mock' }, () => ({ contents: 'export const VO = globalThis.__VO__;', loader: 'js' }));
        b.onLoad({ filter: /^fonts$/, namespace: 'mock' }, () => ({
          contents: "export const FONT_DISPLAY='x',FONT_BODY='x',FONT_MONO='x',FONT_SERIF='x',FONT_EDITORIAL='x';",
          loader: 'js',
        }));
      },
    },
  ],
});
let n = 0;
const load = async (vo) => {
  globalThis.__VO__ = vo;
  return import(pathToFileURL(out).href + `?v=${n++}`); // fresh module => CUES recomputed
};

// ---- scenario generators (line STARTS are fixed: gen_voice.py only rewrites ends + words)
const words = (l) => l.text.split(/\s+/).filter(Boolean).length;
const slowEnd = (l, i) => Math.min(windowEnd(i), l.start + words(l) / 2.0);
const windowEnd = (i) => (i + 1 < BASE.length ? BASE[i + 1].start - 0.05 : TOTAL - 0.3);
let seed = 13;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const withWords = (line, end, jitter) => {
  const ws = line.text.split(/\s+/).filter(Boolean);
  const wts = ws.map((w) => (Math.max(2, w.replace(/[^a-zA-Z0-9]/g, '').length) + 1.6) * (jitter ? 0.5 + rnd() : 1));
  const tot = wts.reduce((a, b) => a + b, 0);
  let t = line.start;
  const words = ws.map((w, k) => {
    const d = (wts[k] / tot) * (end - line.start);
    const o = { w, start: +t.toFixed(3), end: +(t + d * 0.9).toFixed(3) };
    t += d;
    return o;
  });
  return { ...line, end: +end.toFixed(3), words };
};
const scenarios = [
  ['estimated (current)', BASE],
  // slowest plausible narrator ≈ 2.0 words/s (Liam reads ~2.7–3.0), capped by the line's window
  ['slow voice: 2.0 words/s', BASE.map((l, i) => withWords(l, slowEnd(l, i), false))],
  ['fast voice: every line at 60% of estimate', BASE.map((l) => withWords(l, l.start + 0.6 * (l.end - l.start), false))],
  ['very fast voice: 40%', BASE.map((l) => withWords(l, l.start + 0.4 * (l.end - l.start), false))],
];
for (let r = 0; r < RUNS; r++) {
  scenarios.push([
    `random #${r}`,
    BASE.map((l, i) => {
      const lo = l.start + 0.5 * (l.end - l.start);
      return withWords(l, lo + rnd() * (Math.max(lo, slowEnd(l, i)) - lo), true);
    }),
  ]);
}

// ---- assertions
const ORDER = {
  setup: ['myth', 'strike', 'bike', 'price', 'shake'],
  reveal: ['law', 'free', 'competent', 'consideration', 'object', 'boxes', 'binds'],
  twist: ['provable', 'whatsapp', 'paper'],
};
const failures = [];
let worst = { room: Infinity };
for (const [name, vo] of scenarios) {
  let mod;
  try {
    mod = await load(vo);
  } catch (e) {
    failures.push(`${name}: module threw — ${e.message}`);
    continue;
  }
  const { CUES, SEQS } = mod;
  for (const [scene, cues] of Object.entries(CUES)) {
    const dur = SEQS[scene].dur;
    for (const [k, f] of Object.entries(cues)) {
      const room = dur - f;
      if (room < worst.room) worst = { room, scene, k, name };
      if (f < 0 || room < MIN_ROOM) failures.push(`${name}: ${scene}.${k} at local f${f} (scene is ${dur}f)`);
    }
    const ord = ORDER[scene];
    if (ord) for (let i = 1; i < ord.length; i++)
      if (cues[ord[i]] < cues[ord[i - 1]]) failures.push(`${name}: ${scene}.${ord[i]} fires before ${ord[i - 1]}`);
  }
  // captions: a line must finish before the next starts, and all VO before the loop dissolve
  vo.forEach((l, i) => {
    if (i + 1 < vo.length && l.end > vo[i + 1].start) failures.push(`${name}: VO line ${i} overlaps line ${i + 1}`);
  });
  if (SEQS.loop.dur < 45) failures.push(`${name}: loop squeezed to ${SEQS.loop.dur}f (< 1.5s)`);
  const lastEnd = vo[vo.length - 1].end;
  if (lastEnd * FPS > SEQS.loop.from + SEQS.loop.dur) failures.push(`${name}: VO runs past the end`);
}

console.log(`scenarios: ${scenarios.length}`);
console.log(`tightest cue: ${worst.scene}.${worst.k} with ${worst.room}f to spare (${worst.name})`);
if (failures.length) {
  console.log(`FAIL (${failures.length})`);
  [...new Set(failures)].slice(0, 25).forEach((f) => console.log('  - ' + f));
  process.exit(1);
}
console.log('PASS: every cue lands inside its scene, in order, under all voice timings');
