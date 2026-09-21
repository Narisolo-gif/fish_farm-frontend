import { Button, StatCard } from "@/components/ui";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";

export default function StockPage() {
    return (
        <div className="page">
            <PageHeader
                eyebrow="INVENTAIRE"
                title="Stock de provendes"
                description="Quantités disponibles et mouvements récents."
                action={<Button>+ Créer provende</Button>}
            />
            <div className="stats-grid three">
                <StatCard label="Quantité totale" value="1 240 kg" />
                <StatCard label="Entrées (période)" value="+ 480 kg" />
                <StatCard label="Sorties (période)" value="− 260 kg" />
            </div>
            <DataTable
                headers={["Date", "Formule", "Mouvement", "Quantité"]}
                rows={[
                    [
                        "Aujourd'hui",
                        "Starter S1",
                        <span className="badge badge-green" key="today-entry">
                            Entrée
                        </span>,
                        "+ 240 kg",
                    ],
                    [
                        "Hier",
                        "Croissance G2",
                        <span className="badge badge-amber" key="yesterday-exit">
                            Sortie
                        </span>,
                        "− 80 kg",
                    ],
                    [
                        "10 juin 2025",
                        "Starter S1",
                        <span className="badge badge-green" key="june-entry">
                            Entrée
                        </span>,
                        "+ 240 kg",
                    ],
                ]}
            />
        </div>
    );
}
