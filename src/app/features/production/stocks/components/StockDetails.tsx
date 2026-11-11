"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { StockDetailHeader } from "@/app/features/production/stocks/components/StockDetailHeader";
import { getStockDetail, type StockRecord } from "@/app/features/production/stocks/services/stockApi";
import { getLot } from "@/app/features/production/lots/services/lotApi";
import type { StockSection } from "@/app/features/production/stocks/types/stock.types";

const MortalitePerteJournal = dynamic(
    () =>
        import("@/app/features/production/shared/mortalite-ui/components/MortalitePerteJournal").then(
            (module) => module.MortalitePerteJournal,
        ),
    { loading: () => <p className="treatment-section-loading" role="status">Chargement de la mortalité...</p> },
);

const ConsommationProvendeJournal = dynamic(
    () =>
        import("@/app/features/production/shared/provende-ui/components/ConsommationProvendeJournal").then(
            (module) => module.ConsommationProvendeJournal,
        ),
    { loading: () => <p className="treatment-section-loading" role="status">Chargement de la provende...</p> },
);

const PlanHapasSection = dynamic(
    () =>
        import("@/app/features/production/shared/plan-ui/components/PlanHapasSection").then(
            (module) => module.PlanHapasSection,
        ),
    { loading: () => <p className="treatment-section-loading" role="status">Chargement du plan...</p> },
);

const ParamEnvSection = dynamic(
    () => import("@/app/features/production/traitement/components/ParamEnvSection").then((module) => module.ParamEnvSection),
    { loading: () => <p className="treatment-section-loading" role="status">Chargement des paramètres environnementaux...</p> },
);

const StockClotureSection = dynamic(
    () => import("@/app/features/production/stocks/components/StockClotureSection").then((module) => module.StockClotureSection),
    { loading: () => <p className="treatment-section-loading" role="status">Chargement du récapitulatif du stock...</p> },
);

const StockExitHistorySection = dynamic(
    () => import("@/app/features/production/stocks/components/StockExitHistorySection").then((module) => module.StockExitHistorySection),
    { loading: () => <p className="treatment-section-loading" role="status">Chargement de l'historique de sortie...</p> },
);

export function StockDetail({ lotStockageId }: { lotStockageId: string }) {
    const [activeSection, setActiveSection] = useState<StockSection>("mortalite");
    const [visitedSections, setVisitedSections] = useState<StockSection[]>(["mortalite"]);
    const [isClosed, setIsClosed] = useState(false);
    const [stock, setStock] = useState<StockRecord | null>(null);
    const [lotStade, setLotStade] = useState<string | null>(null);
    const [stockError, setStockError] = useState("");
    // Incrémenté après une validation / annulation de sortie : le stade du lot a pu changer.
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let isActive = true;

        async function loadStock() {
            try {
                const detail = await getStockDetail(lotStockageId);
                const lot = await getLot(detail.id_lot);
                if (isActive) {
                    setStock(detail);
                    setLotStade(lot.stade);
                }
            } catch (loadError) {
                if (isActive) {
                    setStockError(
                        loadError instanceof Error ? loadError.message : "Impossible de charger la mise en stock.",
                    );
                }
            }
        }

        void loadStock();
        return () => {
            isActive = false;
        };
    }, [lotStockageId, reloadKey]);

    // Une fois la sortie de stock validée, le lot quitte le stade EN_STOCK : le journal passe en lecture seule.
    const isStockReadOnly = isClosed || (lotStade !== null && lotStade !== "EN_STOCK");

    function selectSection(section: StockSection) {
        setActiveSection(section);
        setVisitedSections((visited) => visited.includes(section) ? visited : [...visited, section]);
    }

    return (
        <div className="page">
            <StockDetailHeader
                lotStockageId={lotStockageId}
                isClosed={isClosed}
                activeFeature={activeSection}
                onFeatureChange={selectSection}
            />
            {visitedSections.includes("mortalite") && (
                <div hidden={activeSection !== "mortalite"}>
                    {stockError ? (
                        <p className="form-error" role="alert">{stockError}</p>
                    ) : stock ? (
                        <MortalitePerteJournal
                            bassinId={stock.id_bassin}
                            bassinCategorie="STOCKS"
                            hapas={stock.hapas.map((hapa) => ({ id: hapa.id_hapa, nom: hapa.nom_hapa }))}
                            restrictToHapas
                            dateMin={stock.date_mise_en_stock.slice(0, 10)}
                            readOnly={isStockReadOnly}
                            readOnlyReason="Le lot n'est plus en stock : le journal est en lecture seule."
                        />
                    ) : (
                        <p className="treatment-section-loading" role="status">Chargement de la mortalité...</p>
                    )}
                </div>
            )}
            {visitedSections.includes("provende") && (
                <div hidden={activeSection !== "provende"}>
                    {stockError ? (
                        <p className="form-error" role="alert">{stockError}</p>
                    ) : stock ? (
                        <ConsommationProvendeJournal
                            bassinId={stock.id_bassin}
                            bassinCategorie="STOCKS"
                            hapas={stock.hapas.map((hapa) => ({ id: hapa.id_hapa, nom: hapa.nom_hapa }))}
                            restrictToHapas
                            dateMin={stock.date_mise_en_stock.slice(0, 10)}
                        />
                    ) : (
                        <p className="treatment-section-loading" role="status">Chargement de la provende...</p>
                    )}
                </div>
            )}
            {/* Monté à chaque ouverture : l'effectif reflète les saisies faites dans les autres onglets. */}
            {activeSection === "plan" && (
                <div>
                    {stockError ? (
                        <p className="form-error" role="alert">{stockError}</p>
                    ) : stock ? (
                        <PlanHapasSection
                            bassinId={stock.id_bassin}
                            lotId={stock.id_lot}
                            hapas={stock.hapas.map((hapa) => ({ id: hapa.id_hapa, nom: hapa.nom_hapa }))}
                        />
                    ) : (
                        <p className="treatment-section-loading" role="status">Chargement du plan...</p>
                    )}
                </div>
            )}
            {visitedSections.includes("environnement") && (
                <div hidden={activeSection !== "environnement"}>
                    <ParamEnvSection basinCategory="STOCKS" />
                </div>
            )}
            {visitedSections.includes("cloture") && (
                <div hidden={activeSection !== "cloture"}>
                    <StockClotureSection
                        lotStockageId={lotStockageId}
                        isClosed={isClosed}
                        onClose={() => setIsClosed(true)}
                    />
                </div>
            )}
            {visitedSections.includes("historique-sortie") && (
                <div hidden={activeSection !== "historique-sortie"}>
                    {stockError ? (
                        <p className="form-error" role="alert">{stockError}</p>
                    ) : stock ? (
                        <StockExitHistorySection
                            lotId={stock.id_lot}
                            dateMiseEnStock={stock.date_mise_en_stock}
                            finalite={stock.finalite}
                            lotStade={lotStade}
                            isClosed={isClosed}
                            onLotChanged={() => setReloadKey((key) => key + 1)}
                        />
                    ) : (
                        <p className="treatment-section-loading" role="status">Chargement de l&apos;historique de sortie...</p>
                    )}
                </div>
            )}
        </div>
    );
}