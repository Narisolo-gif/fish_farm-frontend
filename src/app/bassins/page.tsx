"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { DataTable } from "@/components/DataTable";
import { ListSearch } from "@/components/ListSearch";
import { PageHeader } from "@/components/PageHeader";

export default function BassinsPage() {
    const [search, setSearch] = useState("");

    return (
        <div className="page">
            <PageHeader
                eyebrow="Production"
                title="Bassins et hapas"
                description="Gestion des bassins et des hapas."
                action={<Button href="/bassins/new">+ Nouveau bassin</Button>}
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
                        headers={["Référence", "Nombre d'hapas", "Statut", "Créé le", "Etat"]}
                        rows={[]}
                    />
                    <p className="list-empty-state">Aucune lots enregistrée pour le moment.</p>
                </section>
            </div>

        </div>
    );
}
