"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { TraitementDetailHeader } from "@/app/features/production/traitement/components/TraitementDetailHeader";
import type {
	TraitementDetailData,
	TraitementSection,
} from "@/app/features/production/traitement/types/traitement.types";
import { apiRequest } from "@/lib/apiClient";

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
	const [traitementDetail, setTraitementDetail] = useState<TraitementDetailData | null>(null);
	const [isLoadingDetail, setIsLoadingDetail] = useState(true);
	const [detailError, setDetailError] = useState("");

	useEffect(() => {
		let isActive = true;

		async function loadTraitementDetail() {
			setIsLoadingDetail(true);
			setDetailError("");
			setTraitementDetail(null);

			const accessToken = localStorage.getItem("access_token");
			if (!accessToken) {
				setDetailError("Votre session a expiré. Veuillez vous reconnecter.");
				setIsLoadingDetail(false);
				return;
			}

			try {
				const detail = await apiRequest<TraitementDetailData>(
					`/api/v1/traitement/${encodeURIComponent(traitementId)}/`,
					{ headers: { Authorization: `Bearer ${accessToken}` } },
				);

				if (isActive) {
					setTraitementDetail(detail);
					setIsClosed(detail.statut === "CLOTUREE");
				}
			} catch (loadError) {
				if (isActive) {
					setDetailError(
						loadError instanceof Error
							? loadError.message
							: "Impossible de charger les données du traitement.",
					);
				}
			} finally {
				if (isActive) {
					setIsLoadingDetail(false);
				}
			}
		}

		void loadTraitementDetail();

		return () => {
			isActive = false;
		};
	}, [traitementId]);

	function selectSection(section: TraitementSection) {
		setActiveSection(section);
		setVisitedSections((visited) => visited.includes(section) ? visited : [...visited, section]);
	}

	return (
		<div className="page">
			<TraitementDetailHeader
				traitementId={traitementId}
				referenceLot={traitementDetail?.reference_lot ?? null}
				statut={traitementDetail?.statut ?? null}
				isLoading={isLoadingDetail}
				activeFeature={activeSection}
				onFeatureChange={selectSection}
			/>
			{detailError && <p role="alert">{detailError}</p>}
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