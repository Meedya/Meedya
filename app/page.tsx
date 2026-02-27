"use client";

import { FormEvent, useState } from "react";

type SubmitState = "idle" | "loading" | "success" | "error";

type Service = {
  title: string;
  items: string[];
};

type Project = {
  name: string;
  tag: string;
  image: string;
};

type Testimonial = {
  quote: string;
  person: string;
};

const services: Service[] = [
  {
    title: "Positionierung & Branding",
    items: ["Brand Identity", "Logo Design", "Brand Consulting"]
  },
  {
    title: "Digitale Markenauftritte",
    items: ["Web Development", "UI/UX", "Strategische Seitenarchitektur"]
  },
  {
    title: "Marketing & SEO / GEO",
    items: ["Content Marketing", "Organische Sichtbarkeit", "Anfrageorientierte Funnel"]
  },
  {
    title: "Video, Content & AI-Produktion",
    items: ["Videoproduktion", "Visual Content Creation", "Art Direction"]
  }
];

const projects: Project[] = [
  {
    name: "Landio",
    tag: "SaaS Template",
    image: "https://framerusercontent.com/images/7Z6blF7AUGorUsVSRSQAeYWYM.png"
  },
  {
    name: "Polo",
    tag: "Portfolio",
    image: "https://framerusercontent.com/images/JUVgdcFolmWI9BDDFz5PqQiNKpY.png"
  },
  {
    name: "Portfolite",
    tag: "Template",
    image: "https://framerusercontent.com/images/NEgHiDwMai1BfLPARgdld8m9V5Q.png"
  },
  {
    name: "AtomAI",
    tag: "Produktseite",
    image: "https://framerusercontent.com/images/zG4N60B4w8ib9nQtOhzoFXBWwBk.png"
  }
];

const testimonials: Testimonial[] = [
  {
    quote:
      "Der neue Webauftritt ist endlich klar und ruhig. Kunden verstehen auf Anhieb, was wir tun. Vorher war es ein Flickenteppich.",
    person: "M. Konig, Geschaftsfuhrung"
  },
  {
    quote:
      "Unsere Verkaufsunterlagen wirken jetzt wie eine Marke. Das gibt dem Vertrieb deutlich mehr Sicherheit.",
    person: "A. Fischer, Immobilienvertrieb"
  },
  {
    quote:
      "Social Media war vorher beliebig. Jetzt klare Themen und Designlinie. Weniger Posts, deutlich mehr Ruckmeldung.",
    person: "J. Meier, HR-Leitung"
  },
  {
    quote:
      "Seit dem Marken-Workshop ziehen alle in eine Richtung. Diskussionen wurden deutlich weniger, Entscheidungen schneller.",
    person: "R. Hoffmann, Geschaftsfuhrung"
  }
];

const faqs = [
  "Was umfasst eure Zusammenarbeit konkret?",
  "Wie lange dauert der Markenaufbau bis zur sichtbaren Wirkung?",
  "Arbeitet ihr nur mit laufender Betreuung oder auch projektbasiert?",
  "Welche Ergebnisse konnen wir realistisch erwarten?"
];

export default function HomePage() {
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      fullName: String(formData.get("fullName") || ""),
      email: String(formData.get("email") || ""),
      company: String(formData.get("company") || ""),
      service: String(formData.get("service") || "Markenauftritt"),
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
    <main className="bg-canvas text-paper">
      <div className="grain" aria-hidden="true" />
      <header className="topbar">
        <a href="#home" className="brand">
          <img
            src="https://framerusercontent.com/images/yRZbjyagvllCP5g9I8NoOUFmKY.png?width=1556&height=406"
            alt="Influence"
          />
        </a>
        <nav className="topnav">
          <a href="#leistungen">Leistungen</a>
          <a href="#referenzen">Referenzen</a>
          <a href="#ueber-uns">Uber uns</a>
          <a href="#preise">Preise</a>
        </nav>
        <a className="book-link" href="#kontakt">
          Termin buchen
        </a>
      </header>

      <section id="home" className="hero shell">
        <div className="eyebrow">2 freie Platze | Januar 2026</div>
        <div className="hero-grid">
          <div>
            <h1 className="hero-headline">
              <span className="soft-serif">Markenfuhrung</span> <span>auf</span>
              <br />
              <span>hochstem</span> <span className="soft-serif">Niveau</span>
            </h1>
            <p className="lead">
              Wir verbinden strategisches Branding mit effizientem Marketing und bauen daraus Systeme,
              die aus dem Kern Ihres Unternehmens entstehen: klar, konsistent und hochwirksam.
            </p>
            <div className="hero-actions">
              <a href="#kontakt" className="cta-primary">
                Jetzt Projekt anfragen
              </a>
              <p className="muted">260+ Kundenprojekten</p>
            </div>
          </div>
          <aside className="hero-panel">
            <p>Wirkung entsteht von innen.</p>
            <h2>Qualitat entsteht aus Prozess.</h2>
            <p>
              Gerade in anspruchsvollen Markten entscheiden Klarheit und Vertrauen. Ein gefuhrter
              Markenprozess reduziert Unsicherheit und ordnet Entscheidungen.
            </p>
          </aside>
        </div>
      </section>

      <section className="shell section" id="prozess">
        <div className="section-head">
          <p className="kicker">Wirkung messbar umsetzen</p>
          <h2>Wirkung ist kein Zufall.</h2>
        </div>
        <div className="steps">
          <article>
            <span>Step 1</span>
            <h3>Klare Positionierung schaffen</h3>
            <p>
              Wir definieren, wofur Ihr Unternehmen steht, wen es erreicht und warum man sich fur Sie
              entscheidet. Diese Klarheit ist die Grundlage fur jede weitere Entscheidung.
            </p>
          </article>
          <article>
            <span>Step 2</span>
            <h3>Strategie in Marke ubersetzen</h3>
            <p>
              Website, Prasentationen und Unterlagen folgen derselben Linie und machen Ihr Profil im
              Markt nachvollziehbar.
            </p>
          </article>
          <article>
            <span>Step 3</span>
            <h3>Kontinuierlich verbessern</h3>
            <p>
              Wir begleiten zentrale Kontaktpunkte fortlaufend. So wachst Schritt fur Schritt ein
              Gesamtbild, das qualifizierte Anfragen unterstutzt.
            </p>
          </article>
        </div>
      </section>

      <section id="leistungen" className="shell section">
        <div className="section-head">
          <p className="kicker">Vier Bereiche, ein System</p>
          <h2>So setzen wir Marken um.</h2>
        </div>
        <div className="services-grid">
          {services.map((service) => (
            <article key={service.title} className="tile">
              <h3>{service.title}</h3>
              <ul>
                {service.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="referenzen" className="shell section">
        <div className="section-head row">
          <div>
            <p className="kicker">Ausgewahlte Projekte</p>
            <h2>Referenzen, die Wirkung zeigen.</h2>
          </div>
          <a href="#kontakt" className="text-link">
            Projekte ansehen
          </a>
        </div>
        <div className="project-grid">
          {projects.map((project) => (
            <article className="project" key={project.name}>
              <img src={project.image} alt={project.name} loading="lazy" />
              <div>
                <p>{project.tag}</p>
                <h3>{project.name}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="ueber-uns" className="shell section about">
        <div>
          <p className="kicker">Uber uns - Influence</p>
          <h2>Erfahrung braucht Haltung und Verantwortung.</h2>
          <p>
            Influence begleitet Unternehmen vom ersten Auftritt bis zur nachsten Entwicklungsstufe
            ihrer Marke. Statt Einzelmassnahmen verkaufen wir keine Standardpakete, sondern ein
            gefuhrtes System aus Strategie, Design, Content und Technologie.
          </p>
          <a href="#kontakt" className="cta-primary">
            Jetzt Termin anfragen
          </a>
        </div>
        <div className="video-wrap">
          <video
            src="https://framerusercontent.com/assets/rdCokLxFaFhqcyBFwjzXNI1cBPc.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
      </section>

      <section className="shell section">
        <div className="section-head">
          <p className="kicker">Kundenstimmen</p>
          <h2>Trusted by ambitionierte Teams.</h2>
        </div>
        <div className="trust-strip">
          <span>Audience worldwide</span>
          <span>5/5 Kundenbewertung</span>
          <span>Founder gefuhrtes Setup</span>
          <span>All-in-One Strategy</span>
        </div>
        <div className="quotes">
          {testimonials.map((item) => (
            <blockquote key={item.person} className="quote">
              <p>{item.quote}</p>
              <cite>{item.person}</cite>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="shell section results">
        <div className="section-head">
          <p className="kicker">Kundenergebnisse</p>
          <h2>Was nach der Zusammenarbeit anders ist.</h2>
        </div>
        <div className="results-grid">
          <article className="result-card">
            <p>Family Office · Beteiligungen & Immobilien</p>
            <h3>EUR 250 Mio+</h3>
            <span>begleitetes Bestands- und Investitionsvolumen</span>
          </article>
          <article className="result-card">
            <p>PixelRise Creative Solutions</p>
            <h3>100k+</h3>
            <span>neue Kontakte durch klar gefuhrte Funnels</span>
          </article>
          <article className="result-card">
            <p>NexaCraft Innovations</p>
            <h3>EUR 8m+</h3>
            <span>Opportunity Value aus strukturiertem Markenaufbau</span>
          </article>
        </div>
      </section>

      <section className="shell section compare" id="preise">
        <div className="section-head">
          <p className="kicker">Im direkten Vergleich</p>
          <h2>Raus aus dem Agentur-Chaos, rein in eine gefuhrte Marke.</h2>
        </div>
        <div className="compare-grid">
          <article className="tile positive">
            <h3>Influence</h3>
            <ul>
              <li>Individuelle 1:1 Beratung mit klarer Entscheidungsbasis</li>
              <li>Kuratierte Expertenteams gezielt und flexibel einsetzbar</li>
              <li>Marken-Roadmap mit klaren Meilensteinen</li>
              <li>SEO- und GEO-Fokus fur nachhaltige Sichtbarkeit</li>
              <li>Direkter Private-Chat ohne Umwege</li>
            </ul>
          </article>
          <article className="tile negative">
            <h3>Andere Agenturen</h3>
            <ul>
              <li>Junior-Setups lernen mit Ihrem Budget</li>
              <li>Langsame Antwortzeiten und geringe Prioritat</li>
              <li>Viele Massnahmen ohne klare Entscheidungsbasis</li>
              <li>Austauschbares Branding ohne Tiefe</li>
              <li>Veraltete Strategien ohne Accountability</li>
            </ul>
          </article>
        </div>

        <div className="pricing-grid">
          <article className="price-card featured">
            <p>Monthly</p>
            <h3>EUR 4.900 / month</h3>
            <ul>
              <li>Unbegrenzte Requests</li>
              <li>Schnelle Turnarounds</li>
              <li>Fortlaufende Zusammenarbeit</li>
              <li>Monatlich pausierbar</li>
            </ul>
            <a href="#kontakt" className="cta-primary">
              Verfugbarkeit prufen
            </a>
          </article>
          <article className="price-card">
            <p>Per Project</p>
            <h3>Hero Section Revamp</h3>
            <span>one time payment</span>
            <p>Ideal, wenn ihr mit einer starken ersten Umstellung starten wollt.</p>
          </article>
        </div>
      </section>

      <section className="shell section faq">
        <div className="section-head row">
          <div>
            <p className="kicker">Your Questions Answered</p>
            <h2>Haufige Fragen</h2>
          </div>
          <a href="#kontakt" className="text-link">
            Contact Us
          </a>
        </div>
        <div className="faq-list">
          {faqs.map((faq) => (
            <details key={faq}>
              <summary>{faq}</summary>
              <p>
                Wir beantworten diese Punkte im Erstgesprach konkret auf euer Setup, inklusive Scope,
                Zeitplan und Erwartungswert.
              </p>
            </details>
          ))}
        </div>
      </section>

      <section id="kontakt" className="shell section contact">
        <div>
          <p className="kicker">Reach out anytime</p>
          <h2>Lets stay connected.</h2>
          <p>
            Got a project or wollt ihr zusammenarbeiten? Schreibt uns, wir melden uns mit einer
            klaren Einschatzung zur Machbarkeit.
          </p>
          <p className="mail">adriancarter@support.com</p>
        </div>

        <form className="contact-form" onSubmit={onSubmit}>
          <input name="fullName" placeholder="Name" required minLength={2} />
          <input name="email" type="email" placeholder="E-Mail" required />
          <input name="company" placeholder="Unternehmen" />
          <input name="budget" placeholder="Budgetrahmen" />
          <textarea name="message" placeholder="Kurzbeschreibung" required minLength={10} />
          <button type="submit" disabled={state === "loading"}>
            {state === "loading" ? "Sende..." : "Erstgesprach vereinbaren"}
          </button>
          {state === "success" && <p className="ok">Danke, wir melden uns kurzfristig.</p>}
          {state === "error" && <p className="error">{error}</p>}
        </form>
      </section>

      <footer className="shell footer">
        <p>© 2026 Influence</p>
        <p>
          Made by <span>Framebase</span> · Built in <span>Next.js</span>
        </p>
      </footer>
    </main>
  );
}
