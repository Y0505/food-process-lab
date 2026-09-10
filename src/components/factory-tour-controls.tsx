"use client";

import { useEffect, useRef, useState } from "react";

const TOUR_INTERVAL_MS = 4200;

export default function FactoryTourControls() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;

    const advance = () => {
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(".process-line-stage"));
      if (!buttons.length) return;
      const next = (step + 1) % buttons.length;
      buttons[next]?.click();
      setStep(next);
    };

    timerRef.current = window.setInterval(advance, TOUR_INTERVAL_MS);
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [running, step]);

  const start = () => {
    const first = document.querySelector<HTMLButtonElement>(".process-line-stage");
    first?.click();
    setStep(0);
    setRunning(true);
  };

  const stop = () => {
    setRunning(false);
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div className="factory-tour-controls" aria-label="Factory tour controls">
      <div className="factory-tour-copy">
        <span>GUIDED FACTORY TOUR</span>
        <strong>{running ? "Following the process path" : "Explore the production line"}</strong>
      </div>
      {running ? (
        <button type="button" onClick={stop}>STOP TOUR</button>
      ) : (
        <button type="button" onClick={start}>START TOUR</button>
      )}
    </div>
  );
}
