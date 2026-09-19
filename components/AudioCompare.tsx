"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";

/**
 * Démonstration avant / après avec de vrais extraits audio.
 * Déposer les deux fichiers dans public/audio/ (voir public/audio/README.md).
 * Si un fichier est absent, la ligne se désactive proprement au lieu de mentir au visiteur.
 */
const BAR_COUNT = 44;
const SHAPES = {
  avant: Array.from({ length: BAR_COUNT }, (_, i) => 10 + ((i * 17) % 44)),
  apres: Array.from({ length: BAR_COUNT }, (_, i) => 8 + ((i * 11) % 34)),
};

type Piste = "avant" | "apres";

const PISTES: { id: Piste; src: string; titre: string; detail: string }[] = [
  { id: "avant", src: "/audio/avant.mp3", titre: "Avant", detail: "Voiture · frigo · souffle" },
  { id: "apres", src: "/audio/apres.mp3", titre: "Après Studio Voix", detail: "Voix claire et équilibrée" },
];

export function AudioCompare() {
  const refs = useRef<Record<Piste, HTMLAudioElement | null>>({ avant: null, apres: null });
  const [enCours, setEnCours] = useState<Piste | null>(null);
  const [progres, setProgres] = useState<Record<Piste, number>>({ avant: 0, apres: 0 });
  const [absents, setAbsents] = useState<Piste[]>([]);

  // Une seule piste à la fois : comparer, c'est écouter l'une puis l'autre.
  const basculer = useCallback(
    (id: Piste) => {
      const audio = refs.current[id];
      if (!audio) return;
      if (enCours === id) {
        audio.pause();
        return;
      }
      const autre = refs.current[id === "avant" ? "apres" : "avant"];
      if (autre) {
        autre.pause();
        autre.currentTime = 0;
      }
      audio.play().catch(() => setAbsents((a) => (a.includes(id) ? a : [...a, id])));
      track("demo_ecoutee", undefined, { piste: id });
    },
    [enCours],
  );

  const deplacer = useCallback((id: Piste, ratio: number) => {
    const audio = refs.current[id];
    if (!audio?.duration) return;
    audio.currentTime = Math.min(Math.max(ratio, 0), 1) * audio.duration;
  }, []);

  // Une piste mise en pause depuis l'extérieur (fin de lecture, autre onglet) doit se refléter ici.
  useEffect(() => {
    const audios = PISTES.map(({ id }) => [id, refs.current[id]] as const).filter(([, a]) => a);
    const off = audios.map(([id, audio]) => {
      const a = audio!;
      const onPlay = () => setEnCours(id);
      const onStop = () => setEnCours((c) => (c === id ? null : c));
      const onTime = () => setProgres((p) => ({ ...p, [id]: a.duration ? a.currentTime / a.duration : 0 }));
      const onEnd = () => {
        setEnCours((c) => (c === id ? null : c));
        setProgres((p) => ({ ...p, [id]: 0 }));
      };
      const onError = () => setAbsents((x) => (x.includes(id) ? x : [...x, id]));
      // Le chargement demarre des le rendu : une erreur peut avoir deja eu lieu ici.
      if (a.error) onError();
      a.addEventListener("play", onPlay);
      a.addEventListener("pause", onStop);
      a.addEventListener("timeupdate", onTime);
      a.addEventListener("ended", onEnd);
      a.addEventListener("error", onError);
      return () => {
        a.removeEventListener("play", onPlay);
        a.removeEventListener("pause", onStop);
        a.removeEventListener("timeupdate", onTime);
        a.removeEventListener("ended", onEnd);
        a.removeEventListener("error", onError);
      };
    });
    return () => off.forEach((f) => f());
  }, []);

  return (
    <div className="pro-compare-panel">
      {PISTES.map(({ id, src, titre, detail }) => {
        const absent = absents.includes(id);
        const actif = enCours === id;
        const pct = Math.round(progres[id] * 100);
        return (
          <div key={id} className={`pro-audio-row ${id === "avant" ? "before" : "after"}${absent ? " indispo" : ""}`}>
            <audio ref={(el) => void (refs.current[id] = el)} src={src} preload="metadata" />
            <div className="pro-audio-label">
              <span>{titre}</span>
              <small>{absent ? "Extrait bientôt disponible" : detail}</small>
            </div>
            <button
              type="button"
              className="pro-play"
              onClick={() => basculer(id)}
              disabled={absent}
              aria-label={`${actif ? "Mettre en pause" : "Écouter"} l’extrait « ${titre} »`}
            >
              <span aria-hidden="true">{actif ? "❚❚" : "▶"}</span>
            </button>
            <div
              className={`pro-wave ${id === "avant" ? "noisy" : "clean"}`}
              role="slider"
              tabIndex={absent ? -1 : 0}
              aria-label={`Position de lecture — ${titre}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-valuetext={`${pct} %`}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") deplacer(id, progres[id] + 0.05);
                else if (e.key === "ArrowLeft") deplacer(id, progres[id] - 0.05);
                else if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  basculer(id);
                } else return;
                e.preventDefault();
              }}
              onClick={(e) => {
                const box = e.currentTarget.getBoundingClientRect();
                deplacer(id, (e.clientX - box.left) / box.width);
              }}
            >
              {SHAPES[id].map((h, i) => (
                <i key={i} className={i / BAR_COUNT <= progres[id] ? "lu" : undefined} style={{ height: h }} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
