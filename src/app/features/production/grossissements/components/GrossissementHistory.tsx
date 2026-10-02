"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { DataTable } from "@/components/DataTable";
import { ListSearch } from "@/components/ListSearch";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { useDebouncedValue } from "@/app/hooks/useDebouncedValue";
import { usePagination } from "@/app/hooks/usePagination";

type GrossissementHistoryEntry = {
  reference: string;
  effectifsInitiaux: number;
  effectifsFinaux: number;
  poidsMoyenInitial: number;
  poidsMoyenFinal: number;
};

const historyEntries: GrossissementHistoryEntry[] = [];
const rowsPerPage = 10;

export function GrossissementHistory() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const normalizedSearch = debouncedSearch.trim().toLocaleLowerCase("fr");
  const filteredEntries = historyEntries.filter((entry) =>
    [
      entry.reference,
      entry.effectifsInitiaux,
      entry.effectifsFinaux,
      entry.poidsMoyenInitial,
      entry.poidsMoyenFinal,
    ].some((value) => String(value).toLocaleLowerCase("fr").includes(normalizedSearch)),
  );
  const {
    items: visibleEntries,
    currentPage,
    totalPages,
    goToPage,
    startItem,
    endItem,
  } = usePagination(filteredEntries, rowsPerPage);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Production · Grossissement"
        title="Historique des lots"
        description="Consultez les effectifs et les poids moyens à l'ouverture et à la clôture des cycles."
        action={<Button href="/production/grossissement/nouveau">+ Ouvrir un lot de grossissement</Button>}
      />

      <div className="list-content">
        <div className="list-toolbar">
          <ListSearch
            value={search}
            onChange={setSearch}
            placeholder="Rechercher une référence, un effectif ou un poids..."
            label="Rechercher dans l'historique des grossissements"
          />
          <span className="list-result-count" aria-live="polite">
            {filteredEntries.length} lot{filteredEntries.length > 1 ? "s" : ""}
          </span>
        </div>

        <section className="ecloserie-section" aria-label="Historique des grossissements">
          <DataTable
            className="ecloserie-table"
            headers={[
              "Référence",
              "Effectifs initiaux",
              "Effectifs finaux",
              "Poids moyen initial",
              "Poids moyen final",
            ]}
            rows={visibleEntries.map((entry) => [
              entry.reference,
              entry.effectifsInitiaux.toLocaleString("fr-FR"),
              entry.effectifsFinaux.toLocaleString("fr-FR"),
              entry.poidsMoyenInitial.toLocaleString("fr-FR"),
              entry.poidsMoyenFinal.toLocaleString("fr-FR"),
            ])}
          />

          {filteredEntries.length === 0 && (
            <p className="list-empty-state">
              {historyEntries.length === 0
                ? "Aucun lot de grossissement enregistré pour le moment."
                : "Aucun lot ne correspond à votre recherche."}
            </p>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredEntries.length}
            startItem={startItem}
            endItem={endItem}
            onPageChange={goToPage}
          />
        </section>
      </div>
    </div>
  );
}