"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { DataTable } from "@/components/DataTable";
import { DetailIconLink } from "@/components/DetailIconLink";
import { ListSearch } from "@/components/ListSearch";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { useDebouncedValue } from "@/app/hooks/useDebouncedValue";
import { usePagination } from "@/app/hooks/usePagination";
import { matchesSearch } from "@/lib/search";
import { getLotsGrossissement } from "@/app/features/production/grossissements/services/grossissementApi";
import type { LotGrossissementRecord } from "@/app/features/production/grossissements/types/grossissement.types";
import { especeLabel } from "@/app/features/production/shared/mortalite-ui/types/mortalite.types";

const rowsPerPage = 10;

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR");
}

export function GrossissementHistory() {
  const [lots, setLots] = useState<LotGrossissementRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    let isActive = true;
    getLotsGrossissement()
      .then((loaded) => {
        if (isActive) setLots(loaded);
      })
      .catch((loadError: unknown) => {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Impossible de charger les lots de grossissement.");
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, []);

  const filteredLots = lots.filter((lot) =>
    matchesSearch(
      [
        lot.code,
        lot.reference_lot_origine,
        lot.reference_bassin,
        especeLabel(lot.espece),
        lot.effectif_initial,
        formatDate(lot.date_mise_en_place),
        lot.statut === "CLOTURE" ? "Clôturé" : "Actif",
      ],
      debouncedSearch,
    ),
  );
  const { items: visibleLots, currentPage, totalPages, goToPage, startItem, endItem } = usePagination(
    filteredLots,
    rowsPerPage,
  );

  return (
    <div className="page">
      <PageHeader
        eyebrow="Production · Grossissement"
        title="Historique des lots"
        description="Lots de grossissement ouverts à la validation des sorties de stock."
        action={<Button href="/production/grossissement/nouveau">+ Ouvrir un lot de grossissement</Button>}
      />

      <div className="list-content">
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="list-toolbar">
          <ListSearch
            value={search}
            onChange={(value) => {
              setSearch(value);
              goToPage(1);
            }}
            placeholder="Code, lot d'origine, bassin, espèce..."
            label="Rechercher dans l'historique des grossissements"
          />
          <span className="list-result-count" aria-live="polite">
            {filteredLots.length} lot{filteredLots.length > 1 ? "s" : ""}
          </span>
        </div>

        <section className="ecloserie-section" aria-label="Historique des grossissements">
          {isLoading ? (
            <p className="list-empty-state" role="status">Chargement des lots de grossissement…</p>
          ) : visibleLots.length > 0 ? (
            <DataTable
              className="ecloserie-table table-with-actions"
              headers={["Code", "Lot d'origine", "Bassin", "Espèce", "Mise en place", "Effectif initial", "Statut", "Actions"]}
              rows={visibleLots.map((lot) => [
                <strong key={`${lot.id}-code`}>{lot.code}</strong>,
                lot.reference_lot_origine,
                lot.reference_bassin,
                especeLabel(lot.espece),
                formatDate(lot.date_mise_en_place),
                lot.effectif_initial.toLocaleString("fr-FR"),
                <span key={`${lot.id}-statut`} className={`badge ${lot.statut === "CLOTURE" ? "badge-amber" : "badge-green"}`}>
                  {lot.statut === "CLOTURE" ? "Clôturé" : "Actif"}
                </span>,
                <DetailIconLink
                  key={`${lot.id}-actions`}
                  href={`/production/grossissement/${lot.id}`}
                  label={`Voir le suivi du lot de grossissement ${lot.code}`}
                />,
              ])}
            />
          ) : (
            !error && (
              <p className="list-empty-state">
                {lots.length === 0
                  ? "Aucun lot de grossissement enregistré pour le moment."
                  : "Aucun lot ne correspond à votre recherche."}
              </p>
            )
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredLots.length}
            startItem={startItem}
            endItem={endItem}
            onPageChange={goToPage}
          />
        </section>
      </div>
    </div>
  );
}
