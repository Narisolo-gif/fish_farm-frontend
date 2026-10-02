"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { GrossissementDetailHeader } from "@/app/features/production/grossissements/components/GrossissementDetailHeader";
import type { GrossissementSection } from "@/app/features/production/grossissements/types/grossissement.types";

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

const GrossissementDashboard = dynamic(
  () => import("@/app/features/production/grossissements/components/GrossissementDashboard").then((module) => module.GrossissementDashboard),
  { loading: () => <p className="treatment-section-loading" role="status">Chargement du dashboard...</p> },
);

const PeseesSection = dynamic(
  () => import("@/app/features/production/grossissements/components/PeseesSection").then((module) => module.PeseesSection),
  { loading: () => <p className="treatment-section-loading" role="status">Chargement des pesées...</p> },
);

export function GrossissementDetail() {
  const [activeSection, setActiveSection] = useState<GrossissementSection>("mortalite");
  const [visitedSections, setVisitedSections] = useState<GrossissementSection[]>(["mortalite"]);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setCurrentDate(new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date()));
  }, []);

  function selectSection(section: GrossissementSection) {
    setActiveSection(section);
    setVisitedSections((visited) => visited.includes(section) ? visited : [...visited, section]);
  }

  return (
    <div className="page">
      <GrossissementDetailHeader
        activeFeature={activeSection}
        currentDate={currentDate}
        onFeatureChange={selectSection}
      />
      {visitedSections.includes("mortalite") && (
        <div hidden={activeSection !== "mortalite"}>
          <MortaliteSection />
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
          <ParamEnvSection />
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