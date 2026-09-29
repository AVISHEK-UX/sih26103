"use client";

import { ChevronDown } from "lucide-react";
import styles from "./landing.module.css";

/** Scrolls to the capabilities section; honours reduced-motion for the scroll itself. */
export function ScrollCue({ targetId }: { targetId: string }) {
  const scroll = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(targetId)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };
  return <button type="button" className={styles.scrollCue} onClick={scroll} aria-label="Scroll to what the system does"><ChevronDown size={20} aria-hidden="true" /></button>;
}
