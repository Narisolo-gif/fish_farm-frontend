import Link from "next/link";
import { modules } from "@/lib/data";

export default function HomePage() {
  return (
    <div className="landing">
      <div className="hero-copy">
        <p className="eyebrow">PILOTAGE PISCICOLE · ANOSY</p>
        <h1>Une vue claire sur chaque bassin.</h1>
        <p>
          Le squelette de gestion de votre ferme, de la reproduction au grossissement.
        </p>
        <Link className="button button-primary" href="/dashboard">
          Accéder au dashboard <span>→</span>
        </Link>
      </div>
      <div className="module-grid">
        {modules.map((module) => (
          <Link
            href={`/production/${module.key}`}
            className="module-card"
            key={module.key}
          >
            <span className="module-icon">{module.icon}</span>
            <strong>{module.label}</strong>
            <small>{module.description}</small>
            <span className="card-arrow">↗</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
