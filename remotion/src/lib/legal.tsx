// Legal-myths kit (1080x1920) — reusable visuals for the law / legal-awareness series.
// Everything is icons + type: no real documents, no real case data, nothing that reads as advice.
// All `at` / tick times are frames LOCAL to the enclosing <Sequence>.
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Check, CheckCheck, type LucideIcon } from 'lucide-react';
import { FONT_BODY, FONT_DISPLAY } from '../fonts';
import { EASE_OUT, prog } from './shorts';

const GOLD = '#f5d76e';

// =============================================================================
// ICON BADGE — big round icon plate (handshake, gavel, land plot…). warm = on at f0.
// =============================================================================
export const IconBadge: React.FC<{
  icon: LucideIcon;
  x?: number;
  y: number;
  size?: number;
  color?: string;
  ring?: string;
  at?: number;
  until?: number;
  warm?: boolean;
}> = ({ icon: Icon, x = 540, y, size = 340, color = '#ffffff', ring = GOLD, at = 0, until, warm = false }) => {
  const frame = useCurrentFrame();
  const p = warm ? 1 : EASE_OUT(prog(frame, at, at + 12));
  const out = until === undefined ? 1 : 1 - prog(frame, until - 8, until);
  const o = p * out;
  if (o <= 0.01) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.10), rgba(0,0,0,0.35))',
        border: `6px solid ${ring}88`,
        boxShadow: `0 0 80px ${ring}33, 0 20px 60px rgba(0,0,0,0.5)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: o,
        transform: `scale(${0.85 + 0.15 * p})`,
      }}
    >
      <Icon size={size * 0.56} color={color} strokeWidth={1.6} />
    </div>
  );
};

// =============================================================================
// CHECKLIST — statutory-ingredients card; each row ticks at its own frame.
// =============================================================================
export const Checklist: React.FC<{
  title: string;
  items: { text: string; tick: number }[];
  y: number;
  at?: number;
  accent?: string;
}> = ({ title, items, y, at = 0, accent = '#4db8a8' }) => {
  const frame = useCurrentFrame();
  const enter = EASE_OUT(prog(frame, at, at + 12));
  if (enter <= 0.01) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 90,
        right: 170, // keep clear of the right-side Shorts action rail
        top: y,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 20}px)`,
        background: 'rgba(12,14,20,0.92)',
        border: `2px solid ${GOLD}55`,
        borderRadius: 26,
        padding: '30px 36px',
        boxShadow: '0 20px 80px rgba(0,0,0,0.55)',
      }}
    >
      <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 28, letterSpacing: 4, color: GOLD, textTransform: 'uppercase' }}>
        {title}
      </div>
      {items.map((it, i) => {
        const p = EASE_OUT(prog(frame, it.tick, it.tick + 8));
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 22 }}>
            <div
              style={{
                width: 56,
                height: 56,
                flexShrink: 0,
                borderRadius: 12,
                border: `4px solid ${p > 0 ? accent : 'rgba(255,255,255,0.35)'}`,
                background: `rgba(77,184,168,${0.25 * p})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ transform: `scale(${p > 0 ? 0.6 + 0.4 * p + 0.25 * Math.sin(Math.PI * p) : 0})` }}>
                <Check size={42} color={accent} strokeWidth={3.5} />
              </div>
            </div>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 600,
                fontSize: 44,
                color: p > 0 ? '#ffffff' : 'rgba(255,255,255,0.5)',
              }}
            >
              {it.text}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// =============================================================================
// CHAT MESSAGE — a generic messenger bubble (sent, double-tick). Not any app's branding.
// =============================================================================
export const ChatMessage: React.FC<{
  text: string;
  time?: string;
  y: number;
  at?: number;
  readAt?: number; // ticks turn blue
}> = ({ text, time = '6:42 pm', y, at = 0, readAt }) => {
  const frame = useCurrentFrame();
  const p = EASE_OUT(prog(frame, at, at + 12));
  if (p <= 0.01) return null;
  const read = readAt !== undefined && frame >= readAt;
  return (
    <div
      style={{
        position: 'absolute',
        right: 180,
        top: y,
        maxWidth: 760,
        opacity: p,
        transform: `translateX(${(1 - p) * 120}px)`,
        background: '#1e5b4f',
        borderRadius: '28px 28px 6px 28px',
        padding: '26px 32px 18px',
        boxShadow: '0 16px 50px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ fontFamily: FONT_BODY, fontWeight: 500, fontSize: 42, lineHeight: 1.3, color: '#ffffff' }}>{text}</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <span style={{ fontFamily: FONT_BODY, fontSize: 26, color: 'rgba(255,255,255,0.65)' }}>{time}</span>
        <CheckCheck size={32} color={read ? '#53bdeb' : 'rgba(255,255,255,0.65)'} strokeWidth={2.5} />
      </div>
    </div>
  );
};

// =============================================================================
// MYTH LINE — the misconception, struck through at `strikeAt`.
// =============================================================================
export const MythLine: React.FC<{ text: string; y: number; at?: number; until?: number; strikeAt?: number; size?: number }> = ({
  text,
  y,
  at = 0,
  until,
  strikeAt,
  size = 70,
}) => {
  const frame = useCurrentFrame();
  const out = until === undefined ? 1 : 1 - prog(frame, until - 8, until);
  const p = EASE_OUT(prog(frame, at, at + 12)) * out;
  if (p <= 0.01) return null;
  const s = strikeAt === undefined ? 0 : EASE_OUT(prog(frame, strikeAt, strikeAt + 10));
  return (
    <div style={{ position: 'absolute', top: y, left: 60, right: 60, display: 'flex', justifyContent: 'center', opacity: p }}>
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: size,
            lineHeight: 1.1,
            whiteSpace: 'pre-line',
            textTransform: 'uppercase',
            color: s > 0 ? `rgba(255,255,255,${1 - 0.5 * s})` : '#ffffff',
          }}
        >
          {text}
        </div>
        <div
          style={{
            position: 'absolute',
            left: -10,
            top: '50%',
            height: 10,
            width: `calc(${s * 100}% + 20px)`,
            background: '#e8879f',
            borderRadius: 6,
            transform: 'rotate(-4deg)',
            opacity: s > 0 ? 1 : 0,
          }}
        />
      </div>
    </div>
  );
};
