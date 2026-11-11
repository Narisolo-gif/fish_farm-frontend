"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { GrossissementDetailHeader } from "@/app/features/production/grossissements/components/GrossissementDetailHeader";
import Link from "next/link";
import { getLotGrossissement } from "@/app/features/production/grossissements/services/grossissementApi";
import type {
  GrossissementSection,
  LotGrossissementRecord,
} from "@/app/features/production/grossissements/types/grossissement.types";

const MortalitePerteJournal = dynamic(
  () =>
    import("@/app/features/production/shared/mortalite-ui/components/MortalitePerteJournal").then(
      (module) => module.MortalitePerteJournal,
    ),
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

const GrossissementDashboard = dynamic(
  () => import("@/app/features/production/grossissements/components/GrossissementDashboard").then((module) => module.GrossissementDashboard),
  { loading: () => <p className="treatment-section-loading" role="status">Chargement du dashboard...</p> },
);

const PeseesSection = dynamic(
  () => import("@/app/features/production/grossissements/components/PeseesSection").then((module) => module.PeseesSection),
  { loading: () => <p className="treatment-section-loading" role="status">Chargement des pesées...</p> },
);

export function GrossissementDetail({ grossissementId }: { grossissementId?: string }) {
  const [activeSection, setActiveSection] = useState<GrossissementSection>("mortalite");
  const [visitedSections, setVisitedSections] = useState<GrossissementSection[]>(["mortalite"]);
  const [currentDate, setCurrentDate] = useState("");
  const [lot, setLot] = useState<LotGrossissementRecord | null>(null);
  const [isLoadingLot, setIsLoadingLot] = useState(Boolean(grossissementId));
  const [lotError, setLotError] = useState("");

  useEffect(() => {
    setCurrentDate(new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date()));
  }, []);

  useEffect(() => {
    if (!grossissementId) return;
    let isActive = true;
    getLotGrossissement(grossissementId)
      .then((loaded) => {
        if (isActive) setLot(loaded);
      })
      .catch((loadError: unknown) => {
        if (isActive) {
          setLotError(loadError instanceof Error ? loadError.message : "Impossible de charger le lot de grossissement.");
        }
      })
      .finally(() => {
        if (isActive) setIsLoadingLot(false);
      });
    return () => {
      isActive = false;
    };
  }, [grossissementId]);

  function selectSection(section: GrossissementSection) {
    setActiveSection(section);
    setVisitedSections((visited) => visited.includes(section) ? visited : [...visited, section]);
  }

  return (
    <div className="page">
      <GrossissementDetailHeader
        lot={lot}
        isLoading={isLoadingLot}
        activeFeature={activeSection}
        currentDate={currentDate}
        onFeatureChange={selectSection}
      />
      {lotError && <p className="form-error" role="alert">{lotError}</p>}
      {visitedSections.includes("mortalite") && (
        <div hidden={activeSection !== "mortalite"}>
          {lot ? (
            <MortalitePerteJournal
              bassinId={lot.id_bassin}
              bassinCategorie="GROSSISSEMENT"
              espece={lot.espece}
              dateMin={lot.date_mise_en_place.slice(0, 10)}
              readOnly={lot.statut === "CLOTURE"}
              readOnlyReason="Lot de grossissement clôturé : le journal est en lecture seule."
            />
          ) : isLoadingLot ? (
            <p className="treatment-section-loading" role="status">Chargement de la mortalité...</p>
          ) : !grossissementId ? (
            <p className="list-empty-state">
              Ouvrez un lot depuis l&apos;<Link href="/production/grossissement/historique">historique des grossissements</Link>{" "}
              pour suivre sa mortalité et ses pertes.
            </p>
          ) : null}
        </div>
      )}
      {visitedSections.includes("pesees") && (
        <div hidden={activeSection !== "pesees"}>
          <PeseesSection />
        </div>
      )}
      {visitedSections.includes("provende") && (
        <div hidden={activeSection !== "provende"}>
          <ProvendeSection />
        </div>
      )}
      {visitedSections.includes("environnement") && (
        <div hidden={activeSection !== "environnement"}>
          <ParamEnvSection basinCategory="GROSSISSEMENT" />
        </div>
      )}
      {visitedSections.includes("dashboard") && (
        <div hidden={activeSection !== "dashboard"}>
          <GrossissementDashboard />
        </div>
      )}
    </div>
  );
}