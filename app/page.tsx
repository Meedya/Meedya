"use client";

import { FormEvent, useMemo, useState } from "react";

type SubmitState = "idle" | "loading" | "success" | "error";

const services = ["Website Build", "Custom Coding", "Automation System", "Growth Stack"];

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
    <main className="page-shell">
      <div className="ambient-grid" aria-hidden="true" />
      <header className="hero">
        <div className="hero-badge">Estonia • E-Residency Native Partner</div>
        <h1>
          Wir bauen <span>digitale Maschinen</span> für E-Residency Owner.
        </h1>
        <p>
          Meedya liefert Corporate Websites, produktionsreife Code-Backends und Automationen, damit
          estnische Firmen operativ schneller wachsen.
        </p>
        <div className="service-tape">
          {services.map((service) => (
            <span key={service}>{service}</span>
          ))}
        </div>
      </header>

      <section className="stats-section">
        <article>
          <h2>Business-ready Design</h2>
          <p>Markenauftritt mit klarer Positionierung statt generischer Agentur-Layouts.</p>
        </article>
        <article>
          <h2>Code that ships</h2>
          <p>Next.js + PostgreSQL Architecture, ausgelegt für reale Sales- und Ops-Prozesse.</p>
        </article>
        <article>
          <h2>Automations first</h2>
          <p>Workflows zwischen CRM, Mail, Reporting und Operations ohne manuellen Overhead.</p>
        </article>
      </section>

      <section className="contact-panel" id="contact">
        <div>
          <p className="eyebrow">Project Intake</p>
          <h2>Startet euer nächstes System mit Meedya.</h2>
          <p>
            Beschreibt kurz eure Ziele. Ihr bekommt ein strukturiertes Angebot mit Scope, Zeitplan und
            konkreter Umsetzungsroute.
          </p>
        </div>

        <form className="lead-form" onSubmit={onSubmit}>
          <label>
            Name
            <input name="fullName" required minLength={2} maxLength={120} />
          </label>
          <label>
            E-Mail
            <input name="email" type="email" required />
          </label>
          <label>
            Firma
            <input name="company" maxLength={120} />
          </label>
          <label>
            Service
            <select name="service" required defaultValue="">
              <option value="" disabled>
                Bitte wählen
              </option>
              <option value="Website">Website</option>
              <option value="Coding">Coding</option>
              <option value="Automation">Automation</option>
              <option value="Full Stack Growth">Full Stack Growth</option>
            </select>
          </label>
          <label>
            Budget (optional)
            <input name="budget" placeholder="z.B. 5.000 - 15.000 EUR" maxLength={100} />
          </label>
          <label>
            Kurzbeschreibung
            <textarea name="message" rows={5} required minLength={15} maxLength={1800} />
          </label>
          <button type="submit" disabled={state === "loading"}>
            {state === "loading" ? "Sende..." : "Projekt anfragen"}
          </button>
          {state === "success" && <p className="form-success">Danke, wir melden uns kurzfristig.</p>}
          {state === "error" && <p className="form-error">{error}</p>}
        </form>
      </section>

      <footer className="footer">© {year} Meedya OÜ · Tallinn, Estonia</footer>
    </main>
  );
}
