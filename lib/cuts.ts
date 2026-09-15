// Logique pure des coupes : partagée par l'éditeur (front) et le worker (export FFmpeg).
// Aucune dépendance : ce fichier est copié tel quel dans worker/src/cuts.ts.

export type Word = {
  text: string;
  start: number; // secondes
  end: number;
};

export type CutKind = "manual" | "silence";

export type Cut = {
  id: string;
  start: number;
  end: number;
  kind: CutKind;
};

export type Segment = { start: number; end: number };

export const SILENCE_THRESHOLD = 0.7; // écart entre mots au-delà duquel on coupe
export const SILENCE_KEEP = 0.3; // durée de pause conservée

/** Fusionne les coupes qui se chevauchent ou se touchent, triées par début. */
export function mergeCuts(cuts: Pick<Cut, "start" | "end">[]): Segment[] {
  const sorted = cuts
    .filter((c) => c.end > c.start)
    .map((c) => ({ start: c.start, end: c.end }))
    .sort((a, b) => a.start - b.start);
  const out: Segment[] = [];
  for (const c of sorted) {
    const last = out[out.length - 1];
    if (last && c.start <= last.end + 1e-3) last.end = Math.max(last.end, c.end);
    else out.push({ ...c });
  }
  return out;
}

/** Segments conservés = complément des coupes sur [0, duration]. */
export function keptSegments(cuts: Pick<Cut, "start" | "end">[], duration: number, minLength = 0.02): Segment[] {
  const merged = mergeCuts(cuts);
  const kept: Segment[] = [];
  let cursor = 0;
  for (const c of merged) {
    const start = Math.max(0, Math.min(c.start, duration));
    if (start - cursor >= minLength) kept.push({ start: cursor, end: start });
    cursor = Math.max(cursor, Math.min(c.end, duration));
  }
  if (duration - cursor >= minLength) kept.push({ start: cursor, end: duration });
  return kept;
}

/**
 * Coupes automatiques des silences : tout écart > SILENCE_THRESHOLD entre deux mots
 * est ramené à SILENCE_KEEP (moitié de la pause conservée de chaque côté).
 * Inclut le silence de début et de fin d'enregistrement.
 */
export function silenceCuts(words: Word[], duration: number, threshold = SILENCE_THRESHOLD, keep = SILENCE_KEEP): Cut[] {
  const cuts: Cut[] = [];
  const half = keep / 2;
  const edges: { prevEnd: number; nextStart: number }[] = [];
  if (words.length === 0) return cuts;
  edges.push({ prevEnd: 0 - half, nextStart: words[0].start });
  for (let i = 1; i < words.length; i++) edges.push({ prevEnd: words[i - 1].end, nextStart: words[i].start });
  edges.push({ prevEnd: words[words.length - 1].end, nextStart: duration + half });

  for (const { prevEnd, nextStart } of edges) {
    if (nextStart - prevEnd <= threshold) continue;
    const start = Math.max(0, prevEnd + half);
    const end = Math.min(duration, nextStart - half);
    if (end - start > 0.05) {
      cuts.push({ id: `silence-${start.toFixed(3)}`, start, end, kind: "silence" });
    }
  }
  return cuts;
}

/** Durée finale après application des coupes. */
export function finalDuration(cuts: Pick<Cut, "start" | "end">[], duration: number): number {
  return keptSegments(cuts, duration).reduce((acc, s) => acc + (s.end - s.start), 0);
}

/** Si `t` tombe dans une coupe, renvoie la fin de cette coupe (pour la lecture avec saut). */
export function skipTarget(merged: Segment[], t: number): number | null {
  for (const c of merged) {
    if (t >= c.start && t < c.end) return c.end;
    if (c.start > t) break;
  }
  return null;
}

export type Sentence = { index: number; start: number; end: number; wordIndexes: number[]; text: string };

/** Regroupe les mots en phrases selon la ponctuation finale. */
export function groupSentences(words: Word[]): Sentence[] {
  const sentences: Sentence[] = [];
  let current: number[] = [];
  const flush = () => {
    if (!current.length) return;
    const first = words[current[0]];
    const last = words[current[current.length - 1]];
    sentences.push({
      index: sentences.length,
      start: first.start,
      end: last.end,
      wordIndexes: current,
      text: current.map((i) => words[i].text).join(" "),
    });
    current = [];
  };
  words.forEach((w, i) => {
    current.push(i);
    if (/[.!?…]$/.test(w.text.trim())) flush();
  });
  flush();
  return sentences;
}

/**
 * Filtre FFmpeg : chaque segment conservé est découpé, reçoit un fondu d'entrée/sortie
 * (anti-clics), puis tout est concaténé et normalisé à -16 LUFS.
 */
export function buildFfmpegFilter(segments: Segment[], fade = 0.015): string {
  if (segments.length === 0) throw new Error("Aucun segment à exporter");
  const parts: string[] = [];
  segments.forEach((s, i) => {
    const dur = s.end - s.start;
    const f = Math.min(fade, dur / 4);
    parts.push(
      `[0:a]atrim=start=${s.start.toFixed(3)}:end=${s.end.toFixed(3)},asetpts=PTS-STARTPTS,` +
        `afade=t=in:st=0:d=${f.toFixed(3)},afade=t=out:st=${(dur - f).toFixed(3)}:d=${f.toFixed(3)}[s${i}]`,
    );
  });
  const inputs = segments.map((_, i) => `[s${i}]`).join("");
  parts.push(`${inputs}concat=n=${segments.length}:v=0:a=1[cat]`);
  parts.push(`[cat]loudnorm=I=-16:TP=-1.5:LRA=11[out]`);
  return parts.join(";\n");
}

export function transcriptToTxt(words: Word[], cuts: Pick<Cut, "start" | "end">[] = []): string {
  const merged = mergeCuts(cuts);
  const isCut = (w: Word) => merged.some((c) => w.start >= c.start - 1e-3 && w.end <= c.end + 1e-3);
  return groupSentences(words.filter((w) => !isCut(w)))
    .map((s) => s.text)
    .join("\n");
}
