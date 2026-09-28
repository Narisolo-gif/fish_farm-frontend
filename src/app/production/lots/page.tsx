"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button, SectionHeading } from "@/components/ui";
import { DataTable } from "@/components/DataTable";
import { ListSearch } from "@/components/ListSearch";
import { Pagination } from "@/components/Pagination";
import { PageHeader } from "@/components/PageHeader";
import { apiRequest } from "@/lib/apiClient";
import { useDebouncedValue } from "@/app/hooks/useDebouncedValue";
import { usePagination } from "@/app/hooks/usePagination";

type ApiUser = {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    role?: string | { id: number; libelle: string } | null;
    is_active?: boolean;
    status?: string;
};

type UserListResponse = ApiUser[] | { results: ApiUser[] };
type Role = { id: number; libelle: string };
type RolesResponse = Role[] | { results: Role[] };


export default function LotsPage() {

    return (
        <div className="page">
            <PageHeader
                eyebrow="Production"
                title="Lots"
                description="Historiques des lots."
                action={<Button href="/production/lots/new">+ Nouveau lots</Button>}
            />
            <div className="list-content">
                <div className="list-toolbar">
						<ListSearch
							placeholder="Nom, email, rôle..."
							label="Rechercher un utilisateur"
						/>
						<span className="list-result-count">
						</span>
					</div>
                <section className="ecloserie-section" id="hatching-history">
                    <DataTable
                        className="ecloserie-table"
                        headers={["Référence", "Eclosion", "Espece", "Stade / Statut", "Créé le", "Modifié le"]}
                        rows={[]}
                    />
                    <p className="list-empty-state">Aucune lots enregistrée pour le moment.</p>
                </section>
            </div>

        </div>
    );
}
