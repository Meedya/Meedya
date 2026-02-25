"use client";

import { FormEvent, useMemo, useState } from "react";

type SubmitState = "idle" | "loading" | "success" | "error";

const services = ["Web Systems", "Automation", "Product Engineering", "Growth Ops"];

export default function HomePage() {
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");

  const year = useMemo(() => new Date().getFullYear(), []);

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
      <div className="absolute left-1/2 top-[-20%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-[120px]" />
      <div className="absolute right-[-10%] top-[30%] h-[420px] w-[420px] rounded-full bg-white/5 blur-[140px]" />

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

          <div className="card relative overflow-hidden p-8 animate-rise">
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
        </header>

        <section className="mt-20 grid gap-6 lg:grid-cols-3">
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
            <article key={card.title} className="card p-6">
              <h3 className="text-lg font-semibold text-white">{card.title}</h3>
              <p className="mt-3 text-sm text-white/65">{card.text}</p>
            </article>
          ))}
        </section>

        <section id="contact" className="mt-20 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
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
