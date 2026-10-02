"use client";

import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import { ListSearch } from "@/components/ListSearch";
import { SectionHeading } from "@/components/ui";
import { useDebouncedValue } from "@/app/hooks/useDebouncedValue";

type PeseeHistoryEntry = {
  date: string;
  bassin: string;
  poidsMoyen: string;
  espece: string;
};

const historyEntries: PeseeHistoryEntry[] = [];

export function PeseesSection() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const normalizedSearch = debouncedSearch.trim().toLocaleLowerCase("fr");
  const filteredEntries = historyEntries.filter((entry) =>
    [entry.date, entry.bassin, entry.poidsMoyen, entry.espece]
      .some((value) => value.toLocaleLowerCase("fr").includes(normalizedSearch)),
  );

  return (
    <div className="list-content" aria-label="Suivi des pesées">
      <div className="list-toolbar">
        <ListSearch
          value={search}
          onChange={setSearch}
          placeholder="Rechercher"
          label="Rechercher une pesée"
        />
        <button
          className="button button-ghost"
          type="button"
          disabled
          title="L'import Excel sera disponible prochainement."
        >
          Import Excel
        </button>
      </div>

      <section className="ecloserie-section" aria-label="Historique des poids moyens">
        <SectionHeading title="Historique des poids moyens" />
        <DataTable
          className="ecloserie-table"
          headers={["Date", "Bassin", "Poids moyens", "Espèce"]}
          rows={filteredEntries.map((entry) => [
            entry.date,
            entry.bassin,
            entry.poidsMoyen,
            entry.espece,
          ])}
        />
        {filteredEntries.length === 0 && (
          <p className="list-empty-state">
            {historyEntries.length === 0
              ? "Aucune pesée enregistrée pour le moment."
              : "Aucune pesée ne correspond à votre recherche."}
          </p>
        )}
      </section>
    </div>
  );
}