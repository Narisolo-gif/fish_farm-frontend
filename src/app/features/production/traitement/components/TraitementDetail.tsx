"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { TraitementDetailHeader } from "@/app/features/production/traitement/components/TraitementDetailHeader";
import type { TraitementSection } from "@/app/features/production/traitement/types/traitement.types";

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

const ClotureSection = dynamic(
	() => import("@/app/features/production/traitement/components/ClotureSection").then((module) => module.ClotureSection),
	{ loading: () => <p className="treatment-section-loading" role="status">Chargement du récapitulatif...</p> },
);

export function TraitementDetail({ traitementId }: { traitementId: string }) {
	const [activeSection, setActiveSection] = useState<TraitementSection>("mortalite");
	const [visitedSections, setVisitedSections] = useState<TraitementSection[]>(["mortalite"]);
	const [isClosed, setIsClosed] = useState(false);

	function selectSection(section: TraitementSection) {
		setActiveSection(section);
		setVisitedSections((visited) => visited.includes(section) ? visited : [...visited, section]);
	}

	return (
		<div className="page">
			<TraitementDetailHeader
				traitementId={traitementId}
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
					<ClotureSection
						traitementId={traitementId}
						isClosed={isClosed}
						onClose={() => setIsClosed(true)}
					/>
				</div>
			)}
		</div>
	);
}