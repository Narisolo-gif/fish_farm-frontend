import Link from "next/link";
import { modules } from "@/lib/data";
import productionImage from "../../../images/429661291_359176970324074_4739398200559559945_n.jpg";

export default function ProductionPage() {
  return (
    <div className="page">
      <section
        className="production-hero"
        // style={{
        //   backgroundImage: `linear-gradient(rgba(16, 35, 63, .72), rgba(7, 81, 143, .62)), url(${productionImage.src})`,
        // }}
      >
        <div className="production-hero-content">
          <p className="eyebrow">FISH FARM ANOSY · PRODUCTION</p>
          <h1>Chaque bassin raconte une histoire.</h1>
          <p>Suivez votre production, de la reproduction au grossissement.</p>
        </div>
      </section>
      <div className="production-list">
        {modules.map((module) => (
          <Link
            href={`/production/${module.key}`}
            className="production-row"
            key={module.key}
          >
            <span className="module-icon">{module.icon}</span>
            <span>
              <strong>{module.label}</strong>
              <small>{module.description}</small>
            </span>
            <span className="row-meta">
              Actif <b>→</b>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
