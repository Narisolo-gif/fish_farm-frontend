import { Button } from "@/components/ui";
import { Breadcrumb, PageHeader } from "@/components/PageHeader";
import { lots } from "@/lib/data";

export default async function LotsPage({
    params,
}: {
    params: Promise<{ module: string }>;
}) {
    const { module } = await params;

    return (
        <div className="page">
            <Breadcrumb items={["Production", module, "Lots"]} />
            <PageHeader
                title="Lots / bassins"
                description="Suivez les lots et leur état d&apos;avancement."
                action={
                    <Button href={`/production/${module}/lots/new`}>+ Ouvrir un lot</Button>
                }
            />
            <div className="card-grid">
                {lots.map((lot) => (
                    <article className="lot-card" key={lot.name}>
                        <div className="lot-heading">
                            <strong>{lot.name}</strong>
                            <span className={lot.state === "Actif" ? "badge badge-green" : "badge"}>
                                {lot.state}
                            </span>
                        </div>
                        <p>
                            Effectif <b>{lot.count}</b>
                        </p>
                        <p>
                            Poids moyen <b>{lot.weight}</b>
                        </p>
                        <div className="progress">
                            <span
                                style={{ width: lot.state === "Actif" ? "68%" : "100%" }}
                            />
                        </div>
                        <small>Dernière mesure · Aujourd&apos;hui</small>
                    </article>
                ))}
            </div>
            <p className="helper-text">
                Chaque carte ouvre la configuration du bassin, les paramètres environnementaux et l&apos;historique du lot.
            </p>
        </div>
    );
}
