"use client";

import { CSSProperties, FormEvent, useEffect, useState } from "react";

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

type BlogPost = {
  title: string;
  date: string;
  image: string;
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
    image: "/framer-mirror/framerusercontent.com/eee76c0e5524.png"
  },
  {
    name: "Polo",
    tag: "Portfolio",
    image: "/framer-mirror/framerusercontent.com/4729fbd54212.png"
  },
  {
    name: "Portfolite",
    tag: "Template",
    image: "/framer-mirror/framerusercontent.com/84ebee7c73f5.png"
  },
  {
    name: "AtomAI",
    tag: "Produktseite",
    image: "/framer-mirror/framerusercontent.com/c4660980ceac.png"
  }
];

const testimonials: Testimonial[] = [
  {
    quote:
      "Der neue Webauftritt ist endlich klar und ruhig. Kunden verstehen auf Anhieb, was wir tun. Vorher war es ein Flickenteppich.",
    person: "M. König, Geschäftsführung"
  },
  {
    quote:
      "Unsere Verkaufsunterlagen wirken jetzt wie eine Marke. Das gibt dem Vertrieb deutlich mehr Sicherheit.",
    person: "A. Fischer, Immobilienvertrieb"
  },
  {
    quote:
      "Social Media war vorher beliebig. Jetzt klare Themen und Designlinie. Weniger Posts, deutlich mehr Rückmeldung.",
    person: "J. Meier, HR-Leitung"
  },
  {
    quote:
      "Seit dem Marken-Workshop ziehen alle in eine Richtung. Diskussionen wurden deutlich weniger, Entscheidungen schneller.",
    person: "R. Hoffmann, Geschäftsführung"
  },
  {
    quote:
      "Vorher wahllos gepostet. Jetzt klare und konsistente Bildsprache, sauber ausgespielt mit deutlich relevanteren Kunden-Rückmeldungen.",
    person: "S. Lehmann, Marketingleitung"
  }
];

const logos = [
  "/framer-mirror/framerusercontent.com/1ca298695552.png",
  "/framer-mirror/framerusercontent.com/e6f7d0b357ef.png",
  "/framer-mirror/framerusercontent.com/6262d28c437c.png",
  "/framer-mirror/framerusercontent.com/088968fe444f.png",
  "/framer-mirror/framerusercontent.com/79f14b7be16a.svg",
  "/framer-mirror/framerusercontent.com/f26b38ebe248.svg",
  "/framer-mirror/framerusercontent.com/c8f0912562f5.svg"
];

const blogPosts: BlogPost[] = [
  {
    title: "Why User Experience Is the Most Valuable Part of Your Website",
    date: "Nov 18, 2024",
    image: "/framer-mirror/framerusercontent.com/2839c406e342.png"
  },
  {
    title: "Why Prioritizing Mobile Users Matters More Than Ever",
    date: "Nov 12, 2024",
    image: "/framer-mirror/framerusercontent.com/2fb9252b8c2a.jpg"
  },
  {
    title: "Why Audience-Centered Design Creates More Impactful Websites",
    date: "Nov 9, 2024",
    image: "/framer-mirror/framerusercontent.com/04ab1d9f7b14.png"
  },
  {
    title: "Emerging Web Design Shifts That Will Define 2024",
    date: "Nov 5, 2024",
    image: "/framer-mirror/framerusercontent.com/f5e039e6996a.png"
  },
  {
    title: "How Testimonials Help Build Lasting Trust Online",
    date: "Oct 23, 2024",
    image: "/framer-mirror/framerusercontent.com/719723bfdf78.jpg"
  }
];

const faqs = [
  "Was umfasst eure Zusammenarbeit konkret?",
  "Wie lange dauert der Markenaufbau bis zur sichtbaren Wirkung?",
  "Arbeitet ihr nur mit laufender Betreuung oder auch projektbasiert?",
  "Welche Ergebnisse können wir realistisch erwarten?"
];

export default function HomePage() {
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
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
      <div className="bg-orb bg-orb-a" aria-hidden="true" />
      <div className="bg-orb bg-orb-b" aria-hidden="true" />
      <header className="topbar">
        <a href="#home" className="brand">
          <img
            src="/framer-mirror/framerusercontent.com/6bbe78770d49.png"
            alt="Influence"
          />
        </a>
        <nav className="topnav">
          <a href="#leistungen">Leistungen</a>
          <a href="#referenzen">Referenzen</a>
          <a href="#ueber-uns">Über uns</a>
          <a href="#preise">Preise</a>
        </nav>
        <a className="book-link" href="#kontakt">
          Termin buchen
        </a>
      </header>

      <section id="home" className="hero shell" data-reveal>
        <div className="hero-atmosphere" aria-hidden="true">
          <div className="hero-arc" />
          <div className="hero-particles">
            {Array.from({ length: 22 }).map((_, index) => (
              <span
                key={index}
                style={
                  {
                    "--x": `${(index * 9 + 7) % 100}%`,
                    "--y": `${(index * 13 + 15) % 100}%`,
                    "--s": `${(index % 3) + 1}px`,
                    "--d": `${6 + (index % 7)}s`,
                    "--o": `${0.2 + (index % 5) * 0.14}`
                  } as CSSProperties
                }
              />
            ))}
          </div>
        </div>
        <div className="hero-content">
          <div className="eyebrow pulse-tag">
            <span className="pulse-dot" />
            2 freie Plätze | Januar 2026
          </div>
          <div className="hero-grid">
            <div>
              <h1 className="hero-headline">
                <span className="soft-serif">Markenführung</span> <span>auf</span>
                <br />
                <span>höchstem</span> <span className="soft-serif">Niveau</span>
              </h1>
              <p className="lead">
                Wir verbinden strategisches Branding mit effizientem Marketing und bauen daraus Systeme,
                die aus dem Kern Ihres Unternehmens entstehen: klar, konsistent und hochwirksam.
              </p>
              <div className="hero-actions">
                <a href="#kontakt" className="cta-primary">
                  Jetzt Projekt anfragen
                </a>
                <a href="#kontakt" className="cta-ghost">
                  Zum Erstgespräch
                </a>
                <p className="muted">260+ Kundenprojekten</p>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-ring" aria-hidden="true">
                <svg
                  className="hero-ring-svg"
                  viewBox="0 0 100 100"
                  overflow="visible"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    id="hero-ring-curve"
                    d="M 0 50 L 0 50 A 1 1 0 0 1 100 50 L 100 50 L 100 50 A 1 1 0 0 1 0 50 L 0 50"
                    fill="transparent"
                  />
                  <text>
                    <textPath href="#hero-ring-curve" startOffset="0" dominantBaseline="hanging">
                      Wirkung entsteht von Innen.   ***
                    </textPath>
                  </text>
                </svg>
              </div>
              <div className="hero-image-wrap">
                <img
                  src="/framer-mirror/framerusercontent.com/t98Yw15iamxzjnXyjbW04Xs9M0.jpg"
                  alt="Portrait"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="shell section" id="prozess" data-reveal>
        <div className="section-head">
          <p className="kicker">Wirkung messbar umsetzen</p>
          <h2>Wirkung ist kein Zufall.</h2>
        </div>
        <div className="steps">
          <article>
            <span>Step 1</span>
            <h3>Klare Positionierung schaffen</h3>
            <p>
              Wir definieren, wofür Ihr Unternehmen steht, wen es erreicht und warum man sich für Sie
              entscheidet. Diese Klarheit ist die Grundlage für jede weitere Entscheidung.
            </p>
          </article>
          <article>
            <span>Step 2</span>
            <h3>Strategie in Marke übersetzen</h3>
            <p>
              Website, Präsentationen und Unterlagen folgen derselben Linie und machen Ihr Profil im
              Markt nachvollziehbar.
            </p>
          </article>
          <article>
            <span>Step 3</span>
            <h3>Kontinuierlich verbessern</h3>
            <p>
              Wir begleiten zentrale Kontaktpunkte fortlaufend. So wächst Schritt für Schritt ein
              Gesamtbild, das qualifizierte Anfragen unterstützt.
            </p>
          </article>
        </div>
      </section>

      <section id="leistungen" className="shell section" data-reveal>
        <div className="section-head">
          <p className="kicker">Vier Bereiche, ein System</p>
          <h2>So setzen wir Marken um.</h2>
        </div>
        <div className="services-grid">
          {services.map((service) => (
            <article key={service.title} className="tile" data-reveal>
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

      <section id="referenzen" className="shell section" data-reveal>
        <div className="section-head row">
          <div>
            <p className="kicker">Ausgewählte Projekte</p>
            <h2>Referenzen, die Wirkung zeigen.</h2>
          </div>
          <a href="#kontakt" className="text-link">
            Projekte ansehen
          </a>
        </div>
        <div className="project-grid">
          {projects.map((project) => (
            <article className="project" key={project.name} data-reveal>
              <img src={project.image} alt={project.name} loading="lazy" />
              <div>
                <p>{project.tag}</p>
                <h3>{project.name}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="ueber-uns" className="shell section about" data-reveal>
        <div>
          <p className="kicker">Über uns - Influence</p>
          <h2>Erfahrung braucht Haltung und Verantwortung.</h2>
          <p>
            Influence begleitet Unternehmen vom ersten Auftritt bis zur nächsten Entwicklungsstufe
            ihrer Marke. Statt Einzelmaßnahmen verkaufen wir keine Standardpakete, sondern ein
            geführtes System aus Strategie, Design, Content und Technologie.
          </p>
          <a href="#kontakt" className="cta-primary">
            Jetzt Termin anfragen
          </a>
        </div>
        <div className="video-wrap">
          <video
            src="/framer-mirror/framerusercontent.com/ac1be32cf39c.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
      </section>

      <section className="shell section" data-reveal>
        <div className="section-head">
          <p className="kicker">Kundenstimmen</p>
          <h2>Trusted by ambitionierte Teams.</h2>
        </div>
        <div className="trust-strip">
          <span>Audience worldwide</span>
          <span>5/5 Kundenbewertung</span>
          <span>Founder geführtes Setup</span>
          <span>All-in-One Strategy</span>
        </div>
        <div className="quotes">
          {testimonials.map((item) => (
            <blockquote key={item.person} className="quote" data-reveal>
              <p>{item.quote}</p>
              <cite>{item.person}</cite>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="shell section results" data-reveal>
        <div className="section-head">
          <p className="kicker">Kundenergebnisse</p>
          <h2>Was nach der Zusammenarbeit anders ist.</h2>
        </div>
        <div className="results-grid">
          <article className="result-card" data-reveal>
            <p>Family Office · Beteiligungen & Immobilien</p>
            <h3>EUR 250 Mio+</h3>
            <span>begleitetes Bestands- und Investitionsvolumen</span>
          </article>
          <article className="result-card" data-reveal>
            <p>PixelRise Creative Solutions</p>
            <h3>100k+</h3>
            <span>neue Kontakte durch klar geführte Funnels</span>
          </article>
          <article className="result-card" data-reveal>
            <p>NexaCraft Innovations</p>
            <h3>EUR 8m+</h3>
            <span>Opportunity Value aus strukturiertem Markenaufbau</span>
          </article>
        </div>
      </section>

      <section className="shell section compare" id="preise" data-reveal>
        <div className="section-head">
          <p className="kicker">Im direkten Vergleich</p>
          <h2>Raus aus dem Agentur-Chaos, rein in eine geführte Marke.</h2>
        </div>
        <div className="compare-grid">
          <article className="tile positive" data-reveal>
            <h3>Influence</h3>
            <ul>
              <li>Individuelle 1:1 Beratung mit klarer Entscheidungsbasis</li>
              <li>Kuratierte Expertenteams gezielt und flexibel einsetzbar</li>
              <li>Marken-Roadmap mit klaren Meilensteinen</li>
              <li>SEO- und GEO-Fokus für nachhaltige Sichtbarkeit</li>
              <li>Direkter Private-Chat ohne Umwege</li>
            </ul>
          </article>
          <article className="tile negative" data-reveal>
            <h3>Andere Agenturen</h3>
            <ul>
              <li>Junior-Setups lernen mit Ihrem Budget</li>
              <li>Langsame Antwortzeiten und geringe Priorität</li>
              <li>Viele Maßnahmen ohne klare Entscheidungsbasis</li>
              <li>Austauschbares Branding ohne Tiefe</li>
              <li>Veraltete Strategien ohne Accountability</li>
            </ul>
          </article>
        </div>

        <div className="pricing-grid">
          <article className="price-card featured" data-reveal>
            <p>Monthly</p>
            <h3>EUR 4.900 / month</h3>
            <ul>
              <li>Unbegrenzte Requests</li>
              <li>Schnelle Turnarounds</li>
              <li>Fortlaufende Zusammenarbeit</li>
              <li>Monatlich pausierbar</li>
            </ul>
            <a href="#kontakt" className="cta-primary">
              Verfügbarkeit prüfen
            </a>
          </article>
          <article className="price-card" data-reveal>
            <p>Per Project</p>
            <h3>Hero Section Revamp</h3>
            <span>one time payment</span>
            <p>Ideal, wenn ihr mit einer starken ersten Umstellung starten wollt.</p>
          </article>
        </div>
      </section>

      <section className="shell section faq" data-reveal>
        <div className="section-head row">
          <div>
            <p className="kicker">Your Questions Answered</p>
            <h2>Häufige Fragen</h2>
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
                Wir beantworten diese Punkte im Erstgespräch konkret auf euer Setup, inklusive Scope,
                Zeitplan und Erwartungswert.
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="shell section logos" data-reveal>
        <p className="kicker">Trusted by</p>
        <div className="logo-marquee">
          <div className="logo-track">
            {[...logos, ...logos].map((logo, index) => (
              <img key={`${logo}-${index}`} src={logo} alt="Brand" />
            ))}
          </div>
        </div>
      </section>

      <section className="shell section blog" data-reveal>
        <div className="section-head row">
          <div>
            <p className="kicker">Blog</p>
            <h2>Our Latest Insights</h2>
          </div>
          <a href="#kontakt" className="text-link">
            See All Posts
          </a>
        </div>
        <div className="blog-grid">
          {blogPosts.map((post) => (
            <article key={post.title} className="blog-card" data-reveal>
              <img src={post.image} alt={post.title} loading="lazy" />
              <div>
                <p>{post.date}</p>
                <h3>{post.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="kontakt" className="shell section contact">
        <div>
          <p className="kicker">Reach out anytime</p>
          <h2>Let's stay connected.</h2>
          <p>
            Got a project or wollt ihr zusammenarbeiten? Schreibt uns, wir melden uns mit einer
            klaren Einschätzung zur Machbarkeit.
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
            {state === "loading" ? "Sende..." : "Erstgespräch vereinbaren"}
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
