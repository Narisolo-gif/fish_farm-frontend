import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb, PageHeader } from "@/components/PageHeader";
import { Button, EmptyChart, SectionHeading, StatCard } from "@/components/ui";
import { modules, type ModuleKey } from "@/lib/data";

export function generateStaticParams() {
  return modules.map(({ key }) => ({ module: key }));
}

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module: moduleParam } = await params;
  const moduleData = modules.find(
    (item) => item.key === moduleParam as ModuleKey
  );

  if (!moduleData) notFound();
  return (
    <div className="page">
      <Breadcrumb items={["Production", moduleData.label]} />
      <PageHeader
        eyebrow="MODULE DE PRODUCTION"
        title={moduleData.label}
        description={moduleData.description}
        action={
          <Button href={`/production/${moduleData.key}/lots`}>Voir les lots →</Button>
        }
      />
      <div className="stats-grid">
        <StatCard label="Lots actifs" value="12" detail="+2 ce mois" />
        <StatCard
          label="Biomasse totale"
          value="248 kg"
          detail="Objectif: 300 kg"
        />
        <StatCard label="Alertes en cours" value="03" detail="À examiner" />
      </div>
      <div className="charts-grid">
        <section className="panel">
          <SectionHeading title="Évolution du poids moyen" />
          <EmptyChart>Courbe de suivi du module</EmptyChart>
        </section>
        <section className="panel">
          <SectionHeading title="Activité récente" />
          <ul className="activity-list">
            <li>
              <span className="status-dot green" />
              Contrôle bassin B-01 <small>Aujourd&apos;hui, 09:20</small>
            </li>
            <li>
              <span className="status-dot amber" />
              Nourrissage enregistré <small>Hier, 17:42</small>
            </li>
            <li>
              <span className="status-dot blue" />
              Nouveau lot ajouté <small>12 juin 2025</small>
            </li>
          </ul>
        </section>
      </div>
      <div className="quick-links">
        <Link href={`/production/${moduleData.key}/basins`}>
          Gérer les bassins <span>→</span>
        </Link>
        <Link href={`/production/${moduleData.key}/lots`}>
          Consulter les lots <span>→</span>
        </Link>
        <Link href="/dashboard">
          Retour au dashboard <span>→</span>
        </Link>
      </div>
    </div>
  );
}
