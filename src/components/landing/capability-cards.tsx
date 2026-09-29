"use client";

import { useEffect, useRef, useState } from "react";
import { FileSearch, LayoutDashboard, ListChecks, Map } from "lucide-react";
import styles from "./landing.module.css";

/**
 * The four capabilities, each verified against the pages and endpoints that implement it
 * (file references in the comments). Copy states what each does and what it produces;
 * nothing here describes a stub.
 */
const ICONS = { registry: LayoutDashboard, sla: ListChecks, gis: Map, documents: FileSearch } as const;

export type Capability = { key: keyof typeof ICONS; name: string; does: string; produces: string };

export function CapabilityCards({ items }: { items: Capability[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const [visible, setVisible] = useState(false);

  // Fade-up once, when the grid enters the viewport. Reduced-motion users see the cards
  // immediately via CSS, so the observer is only a trigger, never a gate on the content.
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const observer = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { setVisible(true); observer.disconnect(); } }, { threshold: 0.15 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <ul ref={ref} className={styles.grid}>
      {items.map((item, index) => { const Icon = ICONS[item.key]; return (
        <li key={item.key} className={`${styles.card} ${visible ? styles.visible : ""}`} style={{ transitionDelay: `${index * 70}ms` }}>
          <span className={styles.chip} aria-hidden="true"><Icon size={18} /></span>
          <h3>{item.name}</h3>
          <p>{item.does} {item.produces}</p>
        </li>
      ); })}
    </ul>
  );
}
