import { PageHeader } from "@/components/PageHeader";
import { TraitementFeatureNav } from "@/app/features/production/traitement/components/TraitementFeatureNav";
import type { TraitementSection } from "@/app/features/production/traitement/types/traitement.types";

export function TraitementDetailHeader({
	traitementId,
	isClosed,
	activeFeature,
	onFeatureChange,
}: {
	traitementId: string;
	isClosed: boolean;
	activeFeature: TraitementSection;
	onFeatureChange: (feature: TraitementSection) => void;
}) {
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
					<dd>—</dd>
				</div>
				<div>
					<dt>Statut</dt>
					<dd><span className={`badge${isClosed ? " badge-amber" : " badge-green"}`}>{isClosed ? "Clôturé" : "Ouvert"}</span></dd>
				</div>
			</dl>
			<TraitementFeatureNav activeFeature={activeFeature} onSelect={onFeatureChange} />
		</>
	);
}