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
                title="Stockage"
                description="Historiques des stocks."
                action={<Button href="/production/stock/nouveau">+ Nouveau stock</Button>}
            />
            <div className="list-content">
                <div className="list-toolbar">
                        <ListSearch
                            value={search}
                            onChange={setSearch}
                            placeholder="ref..."
                            label="Rechercher un stock"
                        />
                        <span className="list-result-count">
                        </span>
                    </div>
                <section className="ecloserie-section" id="hatching-history">
                    <DataTable
                        className="ecloserie-table"
                        headers={["Référence", "Lots", "Bassin", "Hapas","quantité","Ouvert le", "Statut", "Details"]}
                        rows={[]}
                    />
                    <p className="list-empty-state">Aucun stock enregistré pour le moment.</p>
                </section>
            </div>

        </div>
    );
}
