"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type SubmitState = "idle" | "loading" | "success" | "error";

const services = ["Web Systems", "Automation", "Product Engineering", "Growth Ops"];
const highlights = [
  {
    title: "E-Residency Launch",
    text: "Corporate website + investor deck system, 32% faster inbound qualification."
  },
  {
    title: "Ops Automation",
    text: "Client onboarding reduced from 12 steps to 4, fully tracked."
  },
  {
    title: "Product Studio",
    text: "Prototype to production in 6 weeks, built with scalable infra."
  }
];

export default function HomePage() {
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");
  const [parallax, setParallax] = useState(0);

  const year = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        setParallax(Math.min(140, y * 0.12));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!items.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      fullName: String(formData.get("fullName") || ""),
      email: String(formData.get("email") || ""),
      company: String(formData.get("company") || ""),
      service: String(formData.get("service") || ""),
      budget: String(formData.get("budget") || ""),
      message: String(formData.get("message") || "")
    };

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Anfrage konnte nicht gesendet werden.");
      }

      setState("success");
      event.currentTarget.reset();
    } catch (submitError) {
      setState("error");
      setError(submitError instanceof Error ? submitError.message : "Unerwarteter Fehler.");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-ink text-chalk">
      <div className="noise absolute inset-0" aria-hidden="true" />
      <div
        className="absolute left-1/2 top-[-20%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-[120px]"
        style={{ transform: `translate(-50%, ${parallax * -0.3}px)` }}
      />
      <div
        className="absolute right-[-10%] top-[30%] h-[420px] w-[420px] rounded-full bg-white/5 blur-[140px]"
        style={{ transform: `translateY(${parallax * 0.4}px)` }}
      />

      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-16">
        <header className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="badge">Estonia · E-Residency Studio</div>
            <div className="space-y-6">
              <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
                Meedya baut <span className="text-white/50">Apple‑like</span> digitale Systeme für
                E‑Residency Unternehmen.
              </h1>
              <p className="text-lg text-white/70">
                Corporate Websites, präzise Code-Basen und Automationen mit Fokus auf Prozessklarheit,
                Geschwindigkeit und messbaren Wachstum.
              </p>
              <div className="flex flex-wrap gap-3">
                {services.map((service) => (
                  <span
                    key={service}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/60"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <a href="#contact" className="primary-button">
                Projekt starten
              </a>
              <button type="button" className="secondary-button">
                Strategy Call
              </button>
            </div>
          </div>

          <div className="relative space-y-8">
            <div className="relative h-[380px]">
              <div
                className="parallax-layer absolute left-4 top-2 w-[72%] rounded-3xl border border-white/15 bg-white/5 p-5 text-sm text-white/70 shadow-glass"
                style={{ transform: `translate3d(0, ${parallax * 0.35}px, 0)` }}
              >
                Intake velocity up 32% · Live ops tracking
              </div>
              <div
                className="parallax-layer absolute right-2 top-24 w-[78%] rounded-3xl border border-white/15 bg-white/10 p-6 text-sm text-white/70 shadow-glass"
                style={{ transform: `translate3d(0, ${parallax * 0.5}px, 0)` }}
              >
                Automations keep every e-residency team aligned.
              </div>
              <div
                className="parallax-layer absolute left-10 top-44 w-[68%] rounded-3xl border border-white/15 bg-white/5 p-5 text-sm text-white/70 shadow-glass"
                style={{ transform: `translate3d(0, ${parallax * 0.65}px, 0)` }}
              >
                Ops dashboards with weekly execution rituals.
              </div>
            </div>

            <div className="card relative overflow-hidden p-8 animate-rise reveal" data-reveal>
              <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-white/5" />
              <div className="relative space-y-6">
                <p className="text-sm uppercase tracking-[0.3em] text-white/40">Meedya Control</p>
                <div className="space-y-3">
                  <div className="divider-line" />
                  <p className="text-3xl font-semibold">Ops Flow Dashboard</p>
                  <p className="text-muted">
                    Ein fokussierter Layer aus Design, Data und Automation, damit eure Teams in Tagen
                    statt Wochen liefern.
                  </p>
                </div>
                <div className="grid gap-4">
                  {[
                    "Conversion Funnels + Lead Ops",
                    "Custom AI Automation",
                    "Realtime KPI Panels"
                  ].map((item) => (
                    <div key={item} className="glass rounded-2xl px-4 py-3 text-sm text-white/70">
                      {item}
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/50">
                  Runbook Version 04 · Updated weekly
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-20 grid gap-6 lg:grid-cols-3 reveal" data-reveal>
          {[
            {
              title: "Design with restraint",
              text: "Minimal, stark, and crafted to feel premium across mobile and desktop."
            },
            {
              title: "Engineering clarity",
              text: "Next.js, PostgreSQL, Prisma — production ready and built for real ops teams."
            },
            {
              title: "Automation momentum",
              text: "We cut manual steps by wiring CRM, billing, onboarding, and analytics."
            }
          ].map((card) => (
            <article key={card.title} className="card hover-glow p-6">
              <h3 className="text-lg font-semibold text-white">{card.title}</h3>
              <p className="mt-3 text-sm text-white/65">{card.text}</p>
            </article>
          ))}
        </section>

        <section className="mt-20 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] reveal" data-reveal>
          <div className="card p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">Signal Layer</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Control room for growth.</h2>
            <p className="mt-4 text-sm text-white/70">
              Wir kombinieren Design, Automationen und technische Architektur in einem klaren
              Operations-Framework, das interne Teams entlastet.
            </p>
            <div className="mt-6 grid gap-3">
              {["Sales Automations", "Team Dashboards", "Content Pipelines"].map((item) => (
                <div key={item} className="glass hover-glow rounded-2xl px-4 py-3 text-sm text-white/70">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="card space-y-5 p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">Meedya Stack</p>
            <div className="space-y-4">
              {[
                "Web + Branding",
                "Automation + AI",
                "Product Engineering",
                "Long-term Growth"
              ].map((item) => (
                <div key={item} className="flex items-center justify-between text-sm text-white/70">
                  <span>{item}</span>
                  <span className="text-white/40">→</span>
                </div>
              ))}
            </div>
            <div className="divider-line" />
            <p className="text-xs text-white/40">Built for Estonian companies scaling globally.</p>
          </div>
        </section>

        <section className="mt-20 reveal" data-reveal>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-semibold text-white">Selected work</h2>
            <span className="text-xs uppercase tracking-[0.35em] text-white/40">2024 - 2026</span>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {highlights.map((item) => (
              <article key={item.title} className="card group overflow-hidden">
                <div className="h-32 w-full bg-gradient-to-br from-white/20 via-white/5 to-transparent" />
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white group-hover:text-white/80">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/60">{item.text}</p>
                  <div className="mt-4 text-xs text-white/40">View case →</div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-20 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] reveal" data-reveal>
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">Workflow</p>
            <h2 className="text-3xl font-semibold text-white">From discovery to deploy.</h2>
            <p className="text-sm text-white/60">
              Wir liefern in klaren Phasen. Weniger Meetings, mehr sichtbares Ergebnis.
            </p>
          </div>
          <div className="grid gap-4">
            {[
              "01 · Strategy & Audit",
              "02 · Design System + Prototype",
              "03 · Build & Automations",
              "04 · Launch + Optimization"
            ].map((step) => (
              <div key={step} className="card flex items-center justify-between p-4">
                <span className="text-sm text-white/80">{step}</span>
                <span className="text-xs text-white/40">2-4 weeks</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 reveal" data-reveal>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/40">Storyline</p>
              <h2 className="text-3xl font-semibold text-white">Scroll the journey.</h2>
            </div>
            <span className="text-xs text-white/40">Swipe/scroll inside</span>
          </div>
          <div className="snap-stack mt-6">
            {[
              {
                title: "Discovery",
                text: "Audit of current ops, revenue model, and the growth surface."
              },
              {
                title: "Design System",
                text: "Apple-like UI, brand spine, and reusable components."
              },
              {
                title: "Build + Automation",
                text: "Full-stack implementation with automation pipelines."
              },
              {
                title: "Launch & Iterate",
                text: "Performance tracking and weekly optimization sprints."
              }
            ].map((step, index) => (
              <article key={step.title} className="snap-panel card hover-glow">
                <div className="flex items-center justify-between text-xs text-white/40">
                  <span>Phase 0{index + 1}</span>
                  <span>Meedya Method</span>
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm text-white/65">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" className="mt-20 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] reveal" data-reveal>
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">Project Intake</p>
            <h2 className="text-3xl font-semibold text-white">Startet euer nächstes System.</h2>
            <p className="text-muted">
              Schickt uns die Eckdaten. Ihr bekommt ein strukturiertes Angebot inklusive Zeitplan und
              Scope.
            </p>
            <div className="card p-6">
              <p className="text-sm text-white/70">Antwortzeit: unter 24h</p>
              <p className="mt-2 text-xs text-white/40">based in Tallinn · working worldwide</p>
            </div>
          </div>

          <form className="card space-y-4 p-6" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <input className="input" name="fullName" placeholder="Name" required minLength={2} />
              <input className="input" name="email" type="email" placeholder="E-Mail" required />
            </div>
            <input className="input" name="company" placeholder="Firma" />
            <select className="input" name="service" required defaultValue="">
              <option value="" disabled>
                Service wählen
              </option>
              <option value="Website">Website</option>
              <option value="Coding">Coding</option>
              <option value="Automation">Automation</option>
              <option value="Full Stack Growth">Full Stack Growth</option>
            </select>
            <input className="input" name="budget" placeholder="Budget (z.B. 5k - 15k EUR)" />
            <textarea
              className="input min-h-[140px]"
              name="message"
              placeholder="Kurzbeschreibung"
              required
              minLength={15}
            />
            <button className="primary-button w-full" type="submit" disabled={state === "loading"}>
              {state === "loading" ? "Sende..." : "Projekt anfragen"}
            </button>
            {state === "success" && (
              <p className="text-xs text-emerald-300">Danke, wir melden uns kurzfristig.</p>
            )}
            {state === "error" && <p className="text-xs text-red-300">{error}</p>}
          </form>
        </section>

        <footer className="mt-16 text-xs text-white/40">© {year} Meedya OÜ · Tallinn, Estonia</footer>
      </div>
    </main>
  );
}
