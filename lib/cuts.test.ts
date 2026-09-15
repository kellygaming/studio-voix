// Lancer avec : npm test (Node 22.6+)
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildFfmpegFilter, keptSegments, mergeCuts, silenceCuts, skipTarget, transcriptToTxt, type Word } from "./cuts.ts";

const words: Word[] = [
  { text: "Bonjour", start: 1.0, end: 1.4 },
  { text: "à", start: 1.5, end: 1.6 },
  { text: "tous.", start: 1.7, end: 2.0 },
  { text: "Euh", start: 4.0, end: 4.3 },
  { text: "reprenons.", start: 4.4, end: 5.0 },
];

test("mergeCuts fusionne les chevauchements", () => {
  assert.deepEqual(mergeCuts([{ start: 3, end: 5 }, { start: 1, end: 2 }, { start: 4, end: 6 }]), [
    { start: 1, end: 2 },
    { start: 3, end: 6 },
  ]);
});

test("keptSegments renvoie le complément", () => {
  assert.deepEqual(keptSegments([{ start: 1, end: 2 }], 5), [
    { start: 0, end: 1 },
    { start: 2, end: 5 },
  ]);
});

test("silenceCuts ramène les pauses longues à 0,3 s", () => {
  const cuts = silenceCuts(words, 6);
  // début (0 → 0.85), pause 2.0→4.0, fin 5.0→6
  assert.equal(cuts.length, 3);
  const middle = cuts[1];
  assert.ok(Math.abs(middle.start - 2.15) < 1e-9);
  assert.ok(Math.abs(middle.end - 3.85) < 1e-9);
  assert.ok(Math.abs(4.0 - 2.0 - (middle.end - middle.start) - 0.3) < 1e-9);
});

test("skipTarget saute les coupes", () => {
  const merged = mergeCuts([{ start: 2, end: 3 }]);
  assert.equal(skipTarget(merged, 2.5), 3);
  assert.equal(skipTarget(merged, 1), null);
});

test("transcriptToTxt retire les phrases coupées", () => {
  assert.equal(transcriptToTxt(words, [{ start: 3.9, end: 5.1 }]), "Bonjour à tous.");
});

test("buildFfmpegFilter produit un concat avec loudnorm", () => {
  const f = buildFfmpegFilter([{ start: 0, end: 1 }, { start: 2, end: 3 }]);
  assert.match(f, /concat=n=2:v=0:a=1/);
  assert.match(f, /loudnorm=I=-16/);
});
