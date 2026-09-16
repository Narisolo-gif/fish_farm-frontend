import Link from "next/link";
import { modules } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";

export default function ProductionPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="PRODUCTION"
        title="Accueil production"
        description="Accédez rapidement à chaque module opérationnel."
      />
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
