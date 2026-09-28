"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { DataTable } from "@/components/DataTable";
import { ListSearch } from "@/components/ListSearch";
import { PageHeader } from "@/components/PageHeader";

export default function TraitementsPage() {
    const [search, setSearch] = useState("");

    return (
        <div className="page">
            <PageHeader
                eyebrow="Production"
                title="Traitements"
                description="Historiques des traitements."
                action={<Button href="/production/traitement/nouveau">+ Nouveau traitement</Button>}
            />
            <div className="list-content">
                <div className="list-toolbar">
                        <ListSearch
                            value={search}
                            onChange={setSearch}
                            placeholder="ref..."
                            label="Rechercher un traitement"
                        />
                        <span className="list-result-count">
                        </span>
                    </div>
                <section className="ecloserie-section" id="hatching-history">
                    <DataTable
                        className="ecloserie-table"
                        headers={["Référence", "Lots", "Bassin", "Statut", "Ouvert le", "Cloturé le"]}
                        rows={[]}
                    />
                    <p className="list-empty-state">Aucune lots enregistrée pour le moment.</p>
                </section>
            </div>

        </div>
    );
}
