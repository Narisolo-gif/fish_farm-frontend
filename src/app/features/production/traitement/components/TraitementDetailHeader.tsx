import { PageHeader } from "@/components/PageHeader";
import { TraitementFeatureNav } from "@/app/features/production/traitement/components/TraitementFeatureNav";
import type { TraitementSection } from "@/app/features/production/traitement/types/traitement.types";

export function TraitementDetailHeader({
	traitementId,
	referenceLot,
	statut,
	isLoading,
	activeFeature,
	onFeatureChange,
}: {
	traitementId: string;
	referenceLot: string | null;
	statut: "EN_COURS" | "CLOTUREE" | null;
	isLoading: boolean;
	activeFeature: TraitementSection;
	onFeatureChange: (feature: TraitementSection) => void;
}) {
	const isClosed = statut === "CLOTUREE";

	return (
		<>
			<PageHeader eyebrow="Production" title="Détail du traitement" />
			<dl className="treatment-meta">
				<div>
					<dt>Traitement</dt>
					<dd>{traitementId}</dd>
				</div>
				<div>
					<dt>Lot</dt>
					<dd>{isLoading ? "Chargement..." : referenceLot ?? "—"}</dd>
				</div>
				<div>
					<dt>Statut</dt>
					<dd>
						{isLoading ? "Chargement..." : statut ? (
							<span className={`badge${isClosed ? " badge-amber" : " badge-green"}`}>
								{isClosed ? "Clôturé" : "En cours"}
							</span>
						) : "—"}
					</dd>
				</div>
			</dl>
			<TraitementFeatureNav activeFeature={activeFeature} onSelect={onFeatureChange} />
		</>
	);
}