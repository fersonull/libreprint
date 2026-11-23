"use client";

import type { ProgressEvent } from "@/shared/lib/ticket-progress";

// Browsers only let a page make sound after the visitor has tapped it, so the
// audio context is created on the first tap and reused for later alerts.
let audio: AudioContext | null = null;

export function primeAlertSound() {
  try {
    audio ??= new AudioContext();
    void audio.resume();
  } catch {
    // No Web Audio: vibration and the tab title still work.
  }
}

function beep(frequencies: number[]) {
  if (!audio || audio.state !== "running") return;
  const start = audio.currentTime;
  frequencies.forEach((freq, i) => {
    const osc = audio!.createOscillator();
    const gain = audio!.createGain();
    osc.frequency.value = freq;
    const t = start + i * 0.18;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    osc.connect(gain).connect(audio!.destination);
    osc.start(t);
    osc.stop(t + 0.17);
  });
}

/** Sound and vibration for a ticket that just started printing or became ready. */
export function playProgressAlert(event: ProgressEvent) {
  try {
    navigator.vibrate?.(event === "ready" ? [200, 100, 200, 100, 300] : [200]);
  } catch {
    // Vibration unsupported (desktop, iPhone).
  }
  beep(event === "ready" ? [660, 880, 1100] : [660, 880]);
}
