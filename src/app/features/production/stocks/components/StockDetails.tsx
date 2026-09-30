"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { StockDetailHeader } from "@/app/features/production/stocks/components/StockDetailHeader";
import type { StockSection } from "@/app/features/production/stocks/types/stock.types";

const MortaliteSection = dynamic(
    () => import("@/app/features/production/traitement/components/MortaliteSection").then((module) => module.MortaliteSection),
    { loading: () => <p className="treatment-section-loading" role="status">Chargement de la mortalité...</p> },
);

const ProvendeSection = dynamic(
    () => import("@/app/features/production/traitement/components/ProvendeSection").then((module) => module.ProvendeSection),
    { loading: () => <p className="treatment-section-loading" role="status">Chargement de la provende...</p> },
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
                    <MortaliteSection />
                </div>
            )}
            {visitedSections.includes("provende") && (
                <div hidden={activeSection !== "provende"}>
                    <ProvendeSection />
                </div>
            )}
            {visitedSections.includes("environnement") && (
                <div hidden={activeSection !== "environnement"}>
                    <ParamEnvSection />
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
                    <StockExitHistorySection />
                </div>
            )}
        </div>
    );
}