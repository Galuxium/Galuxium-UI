// app/docs/page.tsx
"use client";

import React, { useEffect,  useRef, useState } from "react";
import {  FiBook, FiLayers, FiCpu, FiShield } from "react-icons/fi";
import { FaBolt,  FaCogs } from "react-icons/fa";

/**
 * Galuxium Docs Page (TypeScript, White Theme)
 *
 * - Typical docs layout (sidebar + scrollable content)
 * - White theme only, gradient headings
 * - Search, copy-to-clipboard, Framer Motion animations
 * - Sidebar exactly as requested
 *
 * Drop into: app/docs/page.tsx
 * Requirements: TailwindCSS, Framer Motion, react-icons
 */

/* -----------------------
   Types
----------------------- */
type SidebarItem = {
  id: string;
  title: string;
};

type CodeBlock = {
  title?: string;
  content: string;
};

type DocSection = {
  id: string;
  title: string;
  body: string[]; // paragraphs
  bullets?: string[];
  code?: CodeBlock[];
};

/* -----------------------
   Sidebar (user-specified)
----------------------- */
const SIDEBAR: SidebarItem[] = [
  { id: "vision", title: "Vision & Philosophy" },
  { id: "platform-overview", title: "Platform Overview" },
  { id: "streaming", title: "Streaming & SSE" },
  { id: "ai-orchestration", title: "AI Orchestration" },
  { id: "security", title: "Security & Compliance" },
  { id: "scaling", title: "Scaling & Performance" },
  { id: "billing", title: "Billing & Plans" },
  { id: "dev-experience", title: "Developer Experience" },
  { id: "contributing", title: "Contributing" },
  { id: "troubleshooting", title: "Troubleshooting" },
  { id: "faq", title: "FAQ" },
];

/* -----------------------
   Long-form content for each section
   Each section is intentionally extensive (multi-paragraph,
   bullets, and code examples) to approximate a full page.
----------------------- */
const DOCS: Record<string, DocSection> = {
  "vision": {
    id: "vision",
    title: "Vision & Philosophy",
    body: [
      `Galuxium exists to democratize product creation. Our vision is that the friction between an idea and a working prototype should be measured in minutes — not weeks. We pursue that by creating tools and defaults which shift the developer's job from bootstrapping to building unique product value.`,
      `We take a product-first, opinionated approach: defaults are chosen for safety, accessibility, and clarity so teams can iterate on features rather than plumbing. Those defaults are not an endpoint — they are a foundation. Advanced teams can customize every part of the system, but newcomers benefit from sensible presets that work well in production.`,
      `Design principles that guide Galuxium:`,
    ],
    bullets: [
      `Speed of iteration — minimal friction to go from idea → runnable code.`,
      `Secure-by-default — safe defaults for auth, storage, and secrets.`,
      `Observability — clear logs, metrics, and error surface so problems are diagnosed quickly.`,
      `Extensibility — modular templates and pluggable integrations so teams can grow without rewriting.`,
      `Human-centered UX — clear progress, immediate feedback (streaming), and actionable errors.`,
    ],
  },

  "platform-overview": {
    id: "platform-overview",
    title: "Platform Overview",
    body: [
      `Galuxium is architected as an orchestration platform that coordinates model calls, template engines, workers, and storage to deliver fully formed project code to end users. It is intentionally separated into logical layers so each concern can scale and evolve independently.`,
      `At a high level the platform comprises: frontend (Next.js App Router), control-plane APIs (Express), generation workers (stateless containers or serverless functions), data stores (Postgres via Supabase), and object storage (S3-compatible). The system is designed to handle interactive streaming for real-time user feedback while maintaining durable artifacts for downloads, audits, and replay.`,
      `Below is an expanded, practical overview of the responsibilities in each layer and the rationale behind them. Each subsection explains trade-offs and operational considerations.`,
    ],
    bullets: [
      `Frontend — user flows, streaming UI, previews.`,
      `Control plane — authentication, orchestration, job submission.`,
      `Workers — LLM orchestration, formatting, linting, zipping.`,
      `Storage — artifact retention, signed URLs, lifecycle policies.`,
      `Telemetry — logs, metrics, traces, and user-level audit logs.`,
    ],
  },

  "streaming": {
    id: "streaming",
    title: "Streaming & SSE",
    body: [
      `Real-time streaming is a core UX pillar of Galuxium. Rather than waiting for the entire project to be generated, we stream files and progress updates as they are produced. This gives users immediate feedback and shortens perceived wait times.`,
      `We use Server-Sent Events (SSE) for browser-friendly streaming. SSE is simple, reliable for text/event streaming, and integrates well with Next.js frontends. Workers emit file events and progress events; the control plane aggregates and forwards these events to the client connection.`,
      `Important considerations for streaming: how to handle partial content, how to resume interrupted streams, and how to persist progress for later replay. We recommend always persisting final artifacts to object storage and writing concise progress snapshots to the database so users can resume or review runs.`,
    ],
    bullets: [
      `Event types: file (content chunk), progress (percentage), meta (file list), error (fatal error)`,
      `Idempotency: files are written atomically; partial writes are marked with a temporary state until completed.`,
      `Resilience: reconnect logic on client, heartbeats from server, and TTLs for stale jobs.`,
    ],
   
  },

  "ai-orchestration": {
    id: "ai-orchestration",
    title: "AI Orchestration",
    body: [
      `AI orchestration sits at the heart of Galuxium's value proposition. The orchestration layer converts high-level user prompts into a deterministic plan of features, then dispatches model prompts to generate files. This involves prompt engineering, validation, and format enforcement.`,
      `We build a pipeline that handles: intent parsing, feature planning, file scaffolding, code generation, and post-processing (formatting, linting, tests). Each step is observable and auditable so operators can trace where a particular piece of code originated.`,
      `To reduce hallucination and increase reliability, we use multi-step validation: unit-level linting, static type checks (when using TypeScript templates), and test harnesses for critical pieces like auth and routing.`,
    ],
    bullets: [
      `Prompt layering: system prompt -> planning prompt -> file-level prompt`,
      `Model routing: choose model based on cost/quality profile and step criticality`,
      `Post-processing: run Prettier, ESLint, and lightweight unit tests where feasible`,
    ],
  },

  "security": {
    id: "security",
    title: "Security & Compliance",
    body: [
      `Security is integrated into every layer of the platform. From encryption and secrets management to row-level security (RLS) in Postgres, we assume every component may be targeted and design mitigations accordingly.`,
      `Key controls include TLS for all network traffic, secrets stored in environment management (not in repo), minimal privileged service accounts, and RBAC for administrative functions. We enforce RLS policies in Supabase so user data is isolated at the database level.`,
      `Operations and incident response: we maintain alerting thresholds, runbooks for common incidents (e.g., auth outage, storage misconfig), and a communication plan for customers. Regular automated dependency scanning and scheduled penetration testing are part of our cadence.`,
    ],
    bullets: [
      `Encryption in-transit (TLS) and at-rest for storage providers that support it`,
      `RLS policies on critical tables (projects, generations, files)`,
      `Secrets only in environment variables / secrets manager (no plaintext in DB)`,
      `Audit logs for generation requests, downloads, and admin actions`,
    ],
  },

  "scaling": {
    id: "scaling",
    title: "Scaling & Performance",
    body: [
      `Galuxium is designed to scale horizontally. The generator workers are stateless: they pull tasks from a queue and produce artifacts independently. This makes it straightforward to autoscale workers based on queue depth or CPU usage.`,
      `The control-plane is sized for low-latency orchestration and is protected by rate limiting. For high concurrency of generation requests, capacity planning must account for model latency and external API rate limits (LLM providers). Caching frequently used templates and prewarming workers for heavy templates reduces tail latency.`,
      `Database scaling strategies include read replicas for heavy-read workloads (dashboards, search), partitioning large audit tables, and using connection pooling for serverless deployments. Object storage scales naturally; focus on lifecycle policies to avoid long-term storage cost growth.`,
    ],
    bullets: [
      `Autoscale workers by queue depth (e.g., Redis list length)`,
      `Cache templates at edge/CDN for read-heavy resources`,
      `Pre-warm model connections or use long-lived worker processes for lower latency`,
      `Monitor generation latencies and LLM error rates to throttle or fallback`,
    ],
  },

  "billing": {
    id: "billing",
    title: "Billing & Plans",
    body: [
      `Galuxium's billing is usage-aware. Primary cost drivers are model compute (tokens / inference), storage, and optional managed services. Billing transparency is important: we show per-generation cost breakdowns and historical usage so teams can optimize prompts and templates.`,
      `Plans are structured to serve hobbyists (free tier), teams (monthly subscriptions with higher quotas), and enterprises (custom pricing, dedicated SLAs). We provide invoice downloads, usage export (CSV), and webhooks for billing events (e.g., invoice paid, payment failed).`,
      `Important operational considerations: protect against abuse (rate limits, CAPTCHA on signup), and put safeguards on expensive models (e.g., require confirmation for long-running or high-cost generations).`,
    ],
    bullets: [
      `Per-generation cost estimate before starting large runs`,
      `Quota enforcement per account and plan`,
      `Invoice generation and CSV exports for accounting`,
      `Webhooks for billing lifecycle events`,
    ],
  },

  "dev-experience": {
    id: "dev-experience",
    title: "Developer Experience",
    body: [
      `Developer experience (DX) is essential to maintainability. Galuxium provides a robust local development setup, seeded projects, and a sandbox mode which simulates generation using deterministic templates. The DX goal is: contributors can run a meaningful developer loop within minutes.`,
      `Tooling includes pre-commit hooks, a standard ESLint + Prettier configuration, a local dev script that spins up a mini Supabase instance (or points to a dev Supabase), and a fake model adapter for offline development.`,
      `Documentation and example projects should be kept up-to-date. We maintain a living onboarding checklist for new engineers: run tests, linting, run sample generation, and deploy a branch to a staging environment.`,
    ],
    bullets: [
      `Local sandbox that bypasses real LLMs (fast iteration)`,
      `Starter seed projects for common stacks (Next + Postgres, Next + Supabase)`,
      `Well-documented CLI for dev tasks (seed, reset, run-worker)`,
      `Automated environment validation scripts to ensure local parity`,
    ],
    code: [
      {
        title: "Local dev commands (example package.json scripts)",
        content:
`"scripts": {
  "dev": "next dev",
  "worker": "node worker/index.js",
  "sandbox": "node tools/sandbox.js"
}`
      }
    ],
  },

  "contributing": {
    id: "contributing",
    title: "Contributing",
    body: [
      `We welcome contributions from the community. The contributor flow is: fork the repo, create a small focused branch, run linters & tests, and open a PR with a clear description and test plan. For larger features, open an RFC issue first to align on design and potential pitfalls.`,
      `We use conventional commits for changelog generation. Community contributors should follow the contribution guidelines, sign any required contributor license if applicable, and expect maintainers to review PRs within a reasonable SLA.`,
      `Maintainability practices: keep PRs small, update documentation with any behavioral changes, and add regression tests for bugfixes. For changes that affect security or billing, at least one senior maintainer approval is required.`,
    ],
    bullets: [
      `Open an issue for large features before coding`,
      `Run full test suite locally before opening a PR`,
      `Use feature flags for behind-the-scenes changes`,
      `Document public behavior changes in the changelog`,
    ],
  },

  "troubleshooting": {
    id: "troubleshooting",
    title: "Troubleshooting",
    body: [
      `This section catalogues common operational issues and practical steps to diagnose and resolve them. Each problem includes recommended checks, likely root causes, and example remediation steps.`,
      `Common categories: generation timeouts, authorization failures, storage permission issues, worker crashes, and streaming interruptions. The general approach to troubleshooting: reproduce, gather telemetry, isolate, fix, and post-mortem.`,
      `We provide queries and commands that help extract the necessary context quickly. For example, check the generations table, job queue length, worker logs, and object storage access logs.`,
    ],
    bullets: [
      `Start by checking job status in the database (generations table)`,
      `Inspect worker logs for stack traces and repeated errors`,
      `Verify environment variables and provider credentials`,
      `Ensure object storage buckets and policies allow expected operations`,
    ],
    code: [
      {
        title: "Useful SQL (check failing generations)",
        content:
`SELECT id, project_id, status, error_message, created_at
FROM generations
WHERE status IN ('failed','error')
ORDER BY created_at DESC
LIMIT 50;`
      }
    ],
  },

  "faq": {
    id: "faq",
    title: "FAQ",
    body: [
      `Q: Are generated projects production-ready?\nA: Generated projects are scaffolded with production-minded defaults (auth, database, CI hints). Teams should still perform code review, verify security configuration, and set appropriate secrets before production deployment.`,
      `Q: Which LLMs do you use?\nA: Galuxium supports multiple LLM backends. Operators can configure preferred providers; we recommend balancing cost and quality. Model selection may be tightened at the account level for cost control.`,
      `Q: How long are artifacts stored?\nA: Generated zips and artifacts follow retention policies controlled by lifecycle rules. Default TTL for temporary artifacts is configurable (e.g., 7 days), while user-requested exports can be longer.`,
    ],
  }
};



/* -----------------------
   Component
----------------------- */
export default function DocsPage() {
const [active, setActive] = useState<string | null>(null);

  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!copyStatus) return;
    const t = setTimeout(() => setCopyStatus(null), 1800);
    return () => clearTimeout(t);
  }, [copyStatus]);

const firstRender = useRef(true); 

  useEffect(() => {
    if (!copyStatus) return;
    const t = setTimeout(() => setCopyStatus(null), 1800);
    return () => clearTimeout(t);
  }, [copyStatus]);

  useEffect(() => {
    if (firstRender.current) {
      // Skip scroll on initial load
      firstRender.current = false;
      return;
    }

    const el = document.getElementById(`section-${active}`);
    if (el && containerRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [active]);




  function renderIconForId(id: string) {
    switch (id) {
      case "vision": return <FiBook className="text-[#2000c1]" />;
      case "platform-overview": return <FiLayers className="text-[#2000c1]" />;
      case "streaming": return <FaBolt className="text-[#2000c1]" />;
      case "ai-orchestration": return <FaCogs className="text-[#2000c1]" />;
      case "security": return <FiShield className="text-[#2000c1]" />;
      case "scaling": return <FiCpu className="text-[#2000c1]" />;
      default: return <FiBook className="text-[#2000c1]" />;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#2000c1]/10 to-[#2e147e]/10 text-[#1A1A1A] p-10">

   
      {/* Main layout */}
      <div className="max-w-8xl mx-auto flex gap-8">
        

     
        {/* Main content */}
        <main className="flex-1 min-w-0" ref={containerRef}>
          <article className="prose max-w-none">
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#2000c1] to-[#2e147e]">
                    Docs
                  </h1>

          
            {/* Detailed sections */}
            <div className="space-y-8 mt-6">
              {SIDEBAR.map((s) => {
                const section = DOCS[s.id];
                if (!section) return null;
                return (
                  <section key={s.id} id={`section-${s.id}`} className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-[#2000c1] flex items-center gap-3">
                          {renderIconForId(s.id)}
                          <span>{section.title}</span>
                        </h2>

                        <div className="mt-4 text-gray-700 space-y-4">
                          {section.body.map((p, i) => (
                            <p key={i} className="leading-relaxed whitespace-pre-line">{p}</p>
                          ))}

                          {section.bullets && (
                            <ul className="list-disc pl-5 mt-2 text-gray-700">
                              {section.bullets.map((b, idx) => <li key={idx}>{b}</li>)}
                            </ul>
                          )}

                          {section.code && section.code.map((c, idx) => (
                            <div key={idx} className="mt-4 rounded-lg overflow-hidden border border-gray-100">
                              <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
                                <div className="text-xs font-medium text-gray-700">{c.title ?? "Code"}</div>
                                
                              </div>
                              <pre className="p-4 text-xs bg-white overflow-x-auto"><code>{c.content}</code></pre>
                            </div>
                          ))}
                        </div>
                      </div>

                     
                    </div>
                  </section>
                );
              })}
            </div>


           
          </article>
        </main>

      {/* Sidebar */}
        <aside className="hidden md:block md:w-64 shrink-0">
          <div className="sticky top-10">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 mb-3">Contents</div>
              <nav className="flex flex-col gap-1">
                {SIDEBAR.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => setActive(it.id)}
                    className={`text-left w-full px-3 text-gray-700 hover:bg-gray-50 py-2 rounded-md text-sm hover:bg-gradient-to-r from-[#2000c1] to-[#2e147e] hover:text-white hover:font-semibold`}
                  >
                    {it.title}
                  </button>
                ))}
              </nav>
            </div>

            <div className="px-3 mt-3 py-3 rounded-2xl bg-gradient-to-r from-[#2000c1] to-[#2e147e] text-white shadow">
              <div className="text-sm font-bold">Get started</div>
              <div className="text-xs mt-2">Create your first MVP — no setup required.</div>
              <div className="mt-3 flex gap-2">
                <a href="#getting-started" className="px-3 py-1 rounded bg-white text-[#2000c1] text-sm">Quickstart</a>
                <a href="/signup" className="px-3 py-1 rounded border border-white/30 text-sm">Sign up</a>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );




}
