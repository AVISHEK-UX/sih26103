import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Activity, ArrowRight } from "lucide-react";
import heroImage from "../../../public/landing-hero.jpg";
import { CapabilityCards, type Capability } from "@/components/landing/capability-cards";
import { ScrollCue } from "@/components/landing/scroll-cue";
import styles from "@/components/landing/landing.module.css";
import type { PortfolioSummary } from "@/lib/prediction-api";

/**
 * Entry page shown before the application. Server-rendered; the three figures come from
 * GET /api/v1/portfolio/summary -- the same endpoint /dashboard uses -- fetched here on the
 * server and cached for a minute. If the API is unreachable the figures are omitted, never
 * substituted.
 */

export const metadata: Metadata = {
  title: "PRAGUKTI | National infrastructure monitoring",
  description: "Monitoring India's public infrastructure portfolio against recorded project data and policy thresholds.",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const SUMMARY_REVALIDATE_SECONDS = 60;

async function loadSummary(): Promise<PortfolioSummary | null> {
  try {
    const response = await fetch(`${API_URL}/api/v1/portfolio/summary`, { next: { revalidate: SUMMARY_REVALIDATE_SECONDS } });
    return response.ok ? ((await response.json()) as PortfolioSummary) : null;
  } catch {
    return null;
  }
}

const formatIndian = (value: number) => value.toLocaleString("en-IN", { maximumFractionDigits: 0 });

// Each card was checked against the code that implements it:
//   registry  -> src/app/dashboard/page.tsx, src/app/projects/page.tsx, backend/app/services/portfolio_service.py
//   sla       -> src/app/sla/page.tsx, backend/app/services/sla_rules_service.py, backend/app/config/sla_rules_config.py
//   gis       -> src/app/gis-check/page.tsx, backend/app/api/routes/gis.py (check-collision), backend/app/schemas/spatial.py
//   documents -> src/app/documents/page.tsx, backend/app/api/routes/document_extraction.py, backend/app/services/analysis_service.py
const CAPABILITIES: Capability[] = [
  { key: "registry", name: "Portfolio monitoring", does: "Every project in the registry is aggregated by sector, state, cost, schedule and progress, with each record searchable and filterable.", produces: "It produces a portfolio overview and a per-project intelligence report built from the recorded fields." },
  { key: "sla", name: "SLA rule evaluation", does: "Five rules compare each project's recorded fields, such as schedule overrun and cost escalation, against configurable policy thresholds.", produces: "It produces a breach list ranked by severity and distance past threshold; breaches are measured, not predicted." },
  { key: "gis", name: "Geospatial boundary screening", does: "A project location and buffer radius are tested against stored restricted-boundary geometry in a projected metre coordinate system.", produces: "It produces the colliding and nearby boundaries with a configured severity band, drawn on a map layer." },
  { key: "documents", name: "Document analysis", does: "Project PDFs such as DPRs and progress reports are read and their text and tables mapped onto the registry fields by label, with a confidence and source line for each value.", produces: "It produces a reviewable set of inputs that, once confirmed, generate and save a report." },
];

export default async function LandingPage() {
  const summary = await loadSummary();
  const figures = summary
    ? [
        { label: "Projects tracked", value: formatIndian(summary.kpis.projects_tracked) },
        { label: "Projects in SLA breach", value: formatIndian(summary.kpis.sla_in_breach) },
        { label: "Cost escalation recorded", value: formatIndian(summary.kpis.cost_overrun_total), unit: summary.kpis.cost_overrun_unit },
      ]
    : [];

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="landing-headline">
        <Image src={heroImage} alt="Aerial view of an elevated rail line and highway interchange under construction, with cranes, earthworks and a river bridge in the distance" fill priority placeholder="blur" sizes="100vw" className={styles.heroImage} />
        <div className={styles.scrim} aria-hidden="true" />
        <div className={styles.brand}><span className={styles.brandMark}><Activity size={17} aria-hidden="true" /></span><span>PRAGUKTI</span><small>INTELLIGENCE</small></div>
        <div className={styles.heroBody}>
          <div className={styles.content}>
            <p className={styles.eyebrow}>National infrastructure monitoring</p>
            <h1 id="landing-headline" className={styles.headline}>Every project.<br />One view.</h1>
            <p className={styles.subtitle}>PRAGUKTI monitors India&apos;s public infrastructure portfolio against recorded project data and policy thresholds. Every figure it shows is computed from the registry, and anything estimated by a model is labelled as such.</p>
            {figures.length > 0 && (
              <ul className={styles.figures} aria-label="Current portfolio figures">
                {figures.map((figure) => <li key={figure.label}><span className={styles.figureLabel}>{figure.label}</span><span className={styles.figureValue}>{figure.value}{figure.unit && <small>{figure.unit}</small>}</span></li>)}
              </ul>
            )}
            <Link href="/dashboard" className={styles.button}>Open dashboard <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </div>
        <ScrollCue targetId="what-it-does" />
      </section>

      <section id="what-it-does" className={styles.section} aria-labelledby="capabilities-title">
        <p className={styles.eyebrow}>Capabilities</p>
        <h2 id="capabilities-title" className={styles.sectionTitle}>What the system does</h2>
        <CapabilityCards items={CAPABILITIES} />
        <div className={styles.method} role="note">
          <p>All portfolio figures are computed from recorded project data, not from model predictions. SLA breaches are measured by comparing a project&apos;s own recorded fields against configurable policy thresholds, so a breach is a fact about the record rather than a forecast. Where a model prediction appears inside a project report, it is labelled as an estimate, shown with its confidence, and accompanied by the factors that produced it. The thresholds and the registry are open to inspection; nothing on this page is derived from anything else.</p>
        </div>
        <footer className={styles.footer}><span>PRAGUKTI Intelligence</span><span>Smart India Hackathon 2026 · Problem statement SIH26103</span></footer>
      </section>
    </div>
  );
}
