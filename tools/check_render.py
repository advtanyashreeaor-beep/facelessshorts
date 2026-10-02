#!/usr/bin/env python3
"""
check_render.py — pre-publish integrity checks for a rendered short (stdlib + ffmpeg only).

  python tools/check_render.py remotion/out/Short13Contract.mp4 [--duration 43] [--loudness]

Checks: 1080x1920 · 30 fps · duration (±0.1s) · no black frames (blackdetect) ·
seamless loop (SSIM of first vs last frame) · optional integrated loudness (-14..-17 LUFS
for an SFX/voice mix). Exits non-zero on any FAIL so it can gate a publish.
"""
import argparse
import json
import re
import subprocess
import sys


def sh(cmd):
    return subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True).stdout


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--duration", type=float, help="expected seconds")
    ap.add_argument("--loudness", action="store_true", help="also measure integrated LUFS")
    ap.add_argument("--min-ssim", type=float, default=0.97, help="loop seam threshold")
    a = ap.parse_args()

    results = []
    ok = lambda name, cond, detail: results.append((name, bool(cond), detail))

    info = json.loads(sh(["ffprobe", "-v", "error", "-print_format", "json", "-show_streams", "-show_format", a.video]))
    v = next((s for s in info.get("streams", []) if s["codec_type"] == "video"), None)
    if v is None:
        sys.exit(f"FAIL: no video stream in {a.video}")
    num, den = (int(x) for x in v["r_frame_rate"].split("/"))
    fps = num / den
    dur = float(info["format"]["duration"])
    has_audio = any(s["codec_type"] == "audio" for s in info["streams"])
    ok("resolution", (v["width"], v["height"]) == (1080, 1920), f"{v['width']}x{v['height']}")
    ok("fps", abs(fps - 30) < 0.01, f"{fps:.2f}")
    ok("pixel format", v.get("pix_fmt") == "yuv420p", v.get("pix_fmt"))
    if a.duration:
        ok("duration", abs(dur - a.duration) <= 0.1, f"{dur:.2f}s (want {a.duration})")

    bd = sh(["ffmpeg", "-v", "info", "-i", a.video, "-vf", "blackdetect=d=0.1:pix_th=0.05", "-an", "-f", "null", "-"])
    blacks = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", bd)
    ok("no black frames", not blacks, ", ".join(f"{s}-{e}s" for s, e in blacks) or "none")

    # loop seam: first frame vs last frame (exact frame index; -ss near EOF can yield no frame)
    n = int(v.get("nb_frames") or round(dur * fps))
    ss = sh(["ffmpeg", "-v", "info", "-i", a.video, "-i", a.video,
             "-filter_complex", f"[0:v]select='eq(n,0)',setpts=PTS-STARTPTS[a];[1:v]select='eq(n,{n - 1})',setpts=PTS-STARTPTS[b];[a][b]ssim",
             "-frames:v", "1", "-f", "null", "-"])
    m = re.search(r"All:([\d.]+)", ss)
    seam = float(m.group(1)) if m else 0.0
    ok("loop seam (SSIM f0 vs last)", seam >= a.min_ssim, f"{seam:.4f} (>= {a.min_ssim})")

    if a.loudness:
        if not has_audio:
            ok("loudness", False, "no audio stream")
        else:
            ln = sh(["ffmpeg", "-v", "info", "-i", a.video, "-af", "ebur128", "-f", "null", "-"])
            mi = re.findall(r"I:\s+(-?[\d.]+) LUFS", ln)
            lufs = float(mi[-1]) if mi else 0.0
            ok("loudness", -17.0 <= lufs <= -14.0, f"{lufs:.1f} LUFS (want -17..-14)")

    w = max(len(r[0]) for r in results)
    for name, good, detail in results:
        print(f"{'PASS' if good else 'FAIL'}  {name:<{w}}  {detail}")
    bad = [r for r in results if not r[1]]
    print(f"{len(results) - len(bad)}/{len(results)} checks passed")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
