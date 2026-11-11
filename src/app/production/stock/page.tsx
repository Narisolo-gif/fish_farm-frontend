"use client";

import { DetailIconLink } from "@/components/DetailIconLink";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { DataTable } from "@/components/DataTable";
import { ListSearch } from "@/components/ListSearch";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { usePagination } from "@/app/hooks/usePagination";
import {
    getStockHistory,
    type StockRecord,
} from "@/app/features/production/stocks/services/stockApi";

function formatDate(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR");
}

export default function StocksPage() {
    const [stocks, setStocks] = useState<StockRecord[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const normalizedSearch = search.trim().toLocaleLowerCase("fr");
    const filteredStocks = stocks.filter((stock) =>
        [
            stock.id,
            stock.reference_lot,
            stock.reference_bassin,
            stock.effectif_entrant,
            stock.observation,
            ...stock.hapas.map((hapa) => hapa.nom_hapa),
        ]
            .join(" ")
            .toLocaleLowerCase("fr")
            .includes(normalizedSearch),
    );
    const {
        items: visibleStocks,
        currentPage,
        totalPages,
        goToPage,
        startItem,
        endItem,
    } = usePagination(filteredStocks, 10);

    useEffect(() => {
        let isActive = true;

        async function loadStocks() {
            try {
                const history = await getStockHistory();
                if (isActive) {
                    setStocks(history);
                }
            } catch (loadError) {
                if (isActive) {
                    setError(
                        loadError instanceof Error
                            ? loadError.message
                            : "Impossible de charger l'historique des stocks.",
                    );
                }
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        }

        void loadStocks();
        return () => {
            isActive = false;
        };
    }, []);

    return (
        <div className="page">
            <PageHeader
                eyebrow="Production"
                title="Stockage"
                description="Historiques des stocks."
                action={<Button href="/production/stock/nouveau">+ Nouveau stock</Button>}
            />
            <div className="list-content">
                {error && <p className="form-error" role="alert">{error}</p>}
                {isLoading ? (
                    <p className="list-empty-state" role="status">Chargement de l&apos;historique des stocks...</p>
                ) : error ? null : (
                    <>
                        <div className="list-toolbar">
                            <ListSearch
                                value={search}
                                onChange={(value) => {
                                    setSearch(value);
                                    goToPage(1);
                                }}
                                placeholder="Référence lot, bassin ou hapa..."
                                label="Rechercher dans l'historique des stocks"
                            />
                            <span className="list-result-count" aria-live="polite">
                                {filteredStocks.length} stock{filteredStocks.length > 1 ? "s" : ""}
                            </span>
                        </div>
                        <section className="ecloserie-section" aria-label="Historique des stocks">
                            {visibleStocks.length > 0 ? (
                                <DataTable
                                    className="ecloserie-table table-with-actions"
                                    headers={["Mise en stock", "Lot", "Bassin", "Hapas", "Effectif entrant", "Date", "Actions"]}
                                    rows={visibleStocks.map((stock) => [
                                        `#${stock.id}`,
                                        stock.reference_lot,
                                        stock.reference_bassin,
                                        stock.hapas.length > 0
                                            ? stock.hapas.map((hapa) => `${hapa.nom_hapa} (${hapa.effectif_entrant})`).join(", ")
                                            : "—",
                                        stock.effectif_entrant.toLocaleString("fr-FR"),
                                        formatDate(stock.date_mise_en_stock),
                                        <DetailIconLink
                                            key={`stock-${stock.id}`}
                                            href={`/production/stock/${stock.id}`}
                                            label={`Voir le détail de la mise en stock #${stock.id}`}
                                        />,
                                    ])}
                                />
                            ) : (
                                <p className="list-empty-state">
                                    {stocks.length === 0
                                        ? "Aucune mise en stock enregistrée pour le moment."
                                        : "Aucun stock ne correspond à la recherche."}
                                </p>
                            )}
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={filteredStocks.length}
                                startItem={startItem}
                                endItem={endItem}
                                onPageChange={goToPage}
                            />
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
