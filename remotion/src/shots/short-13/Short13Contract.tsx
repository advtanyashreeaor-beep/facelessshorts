import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { Bike, FileX, Handshake, LandPlot } from 'lucide-react';
import {
  BigTitle,
  Captions,
  EASE_INOUT,
  Kicker,
  PauseCard,
  ProgressBar,
  ShortsBackdrop,
  Stamp,
  StatChip,
  prog,
  timeWords,
} from '../../lib/shorts';
import { ChatMessage, Checklist, IconBadge, MythLine } from '../../lib/legal';
import { FONT_DISPLAY } from '../../fonts';
import { VO } from './vo.gen';

// =============================================================================
// COMPOSITION CONFIG
// =============================================================================
export const compositionConfig = {
  id: 'Short13Contract',
  durationInSeconds: 43,
  fps: 30,
  width: 1080,
  height: 1920,
};

// =============================================================================
// STYLE CONSTANTS
// =============================================================================
const FPS = 30;
const GOLD = '#f5d76e';
const GREEN = '#4db8a8';
const PINK = '#e8879f';

// =============================================================================
// TIMELINE — scene boundaries (global frames). VO line STARTS are fixed by beats.json
// (gen_voice.py only rewrites ends + word times), so every boundary has slack after its line.
// =============================================================================
// The last line has no next line to bound it, so the twist/loop boundary follows the VO's real
// end: a slower read extends the twist (the PROOF payoff always lands) and shortens the loop.
const TOTAL_F = 43 * FPS;
const LOOP_FROM = Math.max(1212, Math.ceil((VO[VO.length - 1].end + 0.45) * FPS)); // >= 40.4s
const SEQ = {
  hook: { from: 0, dur: 102 }, //        0.0–3.4s
  setup: { from: 102, dur: 288 }, //     3.4–13.0s
  quiz: { from: 390, dur: 120 }, //     13.0–17.0s
  reveal: { from: 510, dur: 405 }, //   17.0–30.5s
  except: { from: 915, dur: 105 }, //   30.5–34.0s
  twist: { from: 1020, dur: LOOP_FROM - 1020 }, // 34.0–(VO end + 0.45s)
  loop: { from: LOOP_FROM, dur: TOTAL_F - LOOP_FROM }, // ≥ 1.5s, checked by stress-short13
} as const;

// =============================================================================
// CUES — derived from the VO WORDS (real ElevenLabs times once voiced, estimates before),
// so every tick/stamp re-syncs when the voice is regenerated. Returns a frame LOCAL to `seq`.
// =============================================================================
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, '');
export const wordSec = (line: number, word: string, nth = 0): number => {
  const hits = timeWords(VO[line]).filter((w) => norm(w.w).startsWith(norm(word)));
  if (!hits[nth]) throw new Error(`Short13Contract: cue word "${word}" not in VO line ${line}`);
  return hits[nth].start;
};
const cue = (seq: keyof typeof SEQ, line: number, word: string, nth = 0) =>
  Math.round(wordSec(line, word, nth) * FPS) - SEQ[seq].from;

// Exported for the stress test (scripts/stress-short13.mjs): every cue must land inside its scene.
export const CUES = {
  setup: { myth: cue('setup', 1, 'most'), strike: cue('setup', 1, 'contract'), bike: cue('setup', 2, 'bike'), price: cue('setup', 2, 'fifty'), shake: cue('setup', 2, 'just') },
  quiz: { card: cue('quiz', 3, 'pause') },
  reveal: {
    law: cue('reveal', 4, 'section'),
    free: cue('reveal', 5, 'free'),
    competent: cue('reveal', 5, 'competent'),
    consideration: cue('reveal', 5, 'consideration'),
    object: cue('reveal', 5, 'object'),
    boxes: cue('reveal', 6, 'boxes'),
    binds: cue('reveal', 6, 'binds'),
  },
  except: { land: cue('except', 7, 'land') },
  twist: { provable: cue('twist', 8, 'provable'), whatsapp: cue('twist', 8, 'whatsapp'), paper: cue('twist', 8, 'paper') },
};
export const SEQS = SEQ;

// =============================================================================
// SCENES
// =============================================================================
const FadeIn: React.FC<{ children: React.ReactNode; dur?: number }> = ({ children, dur = 8 }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: prog(frame, 0, dur) }}>{children}</AbsoluteFill>;
};

// Hook + loop share one look; 'settle' (1.06→1) opens, 'grow' (1→1.06) closes, so the last
// frame lands on frame 0.
const HookScene: React.FC<{ mode: 'settle' | 'grow' }> = ({ mode }) => {
  const frame = useCurrentFrame();
  const settle = mode === 'settle';
  const scale = settle
    ? 1.06 - 0.06 * EASE_INOUT(prog(frame, 0, 28))
    : 1.0 + 0.06 * EASE_INOUT(prog(frame, 0, SEQ.loop.dur - 1));
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      <BigTitle
        lines={[
          { text: 'NO PAPER?', color: '#ffffff' },
          { text: 'STILL A CONTRACT', color: GOLD },
        ]}
        subtitle="legal myths · #1"
        warm
      />
      <IconBadge icon={Handshake} y={800} size={380} warm />
      <Stamp text="LEGALLY BINDING" at={-12} color={PINK} y={1080} size={76} rotate={-7} />
    </AbsoluteFill>
  );
};

const SetupScene: React.FC = () => {
  const c = CUES.setup;
  return (
    <FadeIn>
      <Kicker text="THE MYTH" color={PINK} at={4} until={c.bike - 4} />
      <IconBadge icon={FileX} y={620} size={300} ring={PINK} at={c.myth - 6} until={c.bike - 2} />
      <MythLine text={'Not in writing =\nnot a contract?'} y={860} at={c.myth} until={c.bike - 2} strikeAt={c.strike + 8} />
      <Kicker text="THE DEAL" color={GOLD} at={c.bike - 2} />
      <IconBadge icon={Bike} y={640} size={320} at={c.bike} />
      <PriceTag y={900} at={c.price} />
      <IconBadge icon={Handshake} x={540} y={1120} size={170} at={c.shake} />
    </FadeIn>
  );
};

const PriceTag: React.FC<{ y: number; at: number }> = ({ y, at }) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at, at + 10);
  if (p <= 0.01) return null;
  return (
    <div style={{ position: 'absolute', top: y, left: 0, right: 0, textAlign: 'center', opacity: p }}>
      <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 120, color: GOLD, textShadow: '0 4px 30px rgba(0,0,0,0.6)' }}>
        ₹50,000
      </span>
    </div>
  );
};

const QuizScene: React.FC = () => (
  <FadeIn>
    <IconBadge icon={Bike} y={560} size={260} warm />
    <PriceTag y={740} at={-20} />
    <Sequence from={Math.max(0, CUES.quiz.card - 4)} durationInFrames={SEQ.quiz.dur - Math.max(0, CUES.quiz.card - 4)}>
      <PauseCard durSec={(SEQ.quiz.dur - Math.max(0, CUES.quiz.card - 4)) / FPS} subtitle="can the buyer walk away?" y={1060} />
    </Sequence>
  </FadeIn>
);

const RevealScene: React.FC = () => {
  const c = CUES.reveal;
  return (
    <FadeIn>
      <Kicker text="THE LAW" color={GREEN} at={4} />
      <StatChip label="Indian Contract Act, 1872" value="Section 10 — no writing required" x={90} y={290} w={820} at={c.law} color={GOLD} />
      <Checklist
        title="A contract needs"
        y={520}
        at={c.law + 30}
        items={[
          { text: 'Free consent', tick: c.free },
          { text: 'Competent parties', tick: c.competent },
          { text: 'Lawful consideration', tick: c.consideration },
          { text: 'Lawful object', tick: c.object },
          { text: 'Not declared void', tick: c.boxes },
        ]}
      />
      <Stamp text="BINDING" at={c.binds} color={GREEN} y={1120} size={84} rotate={-6} />
    </FadeIn>
  );
};

const ExceptionScene: React.FC = () => {
  const c = CUES.except;
  return (
    <FadeIn>
      <Kicker text="THE EXCEPTION" color={PINK} at={4} />
      <IconBadge icon={LandPlot} y={640} size={320} ring={PINK} at={6} />
      <StatChip
        label="Sale of land (₹100 or more)"
        value="Registered deed required — Transfer of Property Act §54"
        x={90}
        y={900}
        w={820}
        at={c.land}
        color={PINK}
      />
    </FadeIn>
  );
};

const TwistScene: React.FC = () => {
  const c = CUES.twist;
  return (
    <FadeIn>
      <Kicker text="VALID ≠ PROVABLE" color={GOLD} at={c.provable - 4} />
      <IconBadge icon={Handshake} y={520} size={260} warm />
      <ChatMessage
        text="Confirming: bike sold to you for ₹50,000. Payment Friday."
        y={760}
        at={c.whatsapp}
        readAt={c.whatsapp + 24}
      />
      <Stamp text="PROOF" at={c.paper} color={GREEN} y={1090} size={96} rotate={-8} />
    </FadeIn>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const Short13Contract: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#12101c' }}>
      <ShortsBackdrop base="#12101c" glow="#241d3a" />
      <Sequence from={SEQ.hook.from} durationInFrames={SEQ.hook.dur}>
        <HookScene mode="settle" />
      </Sequence>
      <Sequence from={SEQ.setup.from} durationInFrames={SEQ.setup.dur}>
        <SetupScene />
      </Sequence>
      <Sequence from={SEQ.quiz.from} durationInFrames={SEQ.quiz.dur}>
        <QuizScene />
      </Sequence>
      <Sequence from={SEQ.reveal.from} durationInFrames={SEQ.reveal.dur}>
        <RevealScene />
      </Sequence>
      <Sequence from={SEQ.except.from} durationInFrames={SEQ.except.dur}>
        <ExceptionScene />
      </Sequence>
      <Sequence from={SEQ.twist.from} durationInFrames={SEQ.twist.dur}>
        <TwistScene />
      </Sequence>
      <Sequence from={SEQ.loop.from} durationInFrames={SEQ.loop.dur}>
        <FadeIn dur={14}>
          <HookScene mode="grow" />
        </FadeIn>
      </Sequence>
      {/* y1340: the 2-line block stays above the y1420 Shorts UI line (lib/shorts SAFE) */}
      <Captions lines={VO} y={1340} accent={GOLD} />
      <ProgressBar color={GOLD} />
    </AbsoluteFill>
  );
};

export default Short13Contract;
