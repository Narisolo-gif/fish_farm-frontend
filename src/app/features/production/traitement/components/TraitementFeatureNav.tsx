import type { TraitementFeature, TraitementSection } from "@/app/features/production/traitement/types/traitement.types";

const features: { id: TraitementFeature; label: string }[] = [
	{ id: "mortalite", label: "Mortalité" },
	{ id: "provende", label: "Provende" },
	{ id: "plan", label: "Plan" },
	{ id: "environnement", label: "Paramètre env." },
	{ id: "cloture", label: "Clôturer" },
	{ id: "historique-sortie", label: "Historique de sortie" },
];

export function TraitementFeatureNav({
	activeFeature,
	onSelect,
}: {
	activeFeature: TraitementSection;
	onSelect: (feature: TraitementSection) => void;
}) {
	return (
		<nav className="treatment-feature-nav" aria-label="Fonctionnalités du traitement">
			{features.map((feature) => {
				const isActive = feature.id === activeFeature;

				return (
					<button
						key={feature.id}
						type="button"
						className={`treatment-feature-button${isActive ? " is-active" : ""}`}
						aria-current={isActive ? "page" : undefined}
						onClick={() => onSelect(feature.id)}
					>
						{feature.label}
					</button>
				);
			})}
		</nav>
	);
}