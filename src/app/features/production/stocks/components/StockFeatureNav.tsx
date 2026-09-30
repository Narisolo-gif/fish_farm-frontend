import type { StockFeature, StockSection } from "@/app/features/production/stocks/types/stock.types";

const features: { id: StockFeature; label: string }[] = [
    { id: "mortalite", label: "Mortalité" },
    { id: "provende", label: "Provende" },
    { id: "plan", label: "Plan" },
    { id: "environnement", label: "Paramètre env." },
    { id: "cloture", label: "Clôturer" },
    { id: "historique-sortie", label: "Historique de sortie" },
];

export function StockFeatureNav({
    activeFeature,
    onSelect,
}: {
    activeFeature: StockSection;
    onSelect: (feature: StockSection) => void;
}) {
    return (
        <nav className="stock-feature-nav" aria-label="Sections du stock">
            {features.map((feature) => {
                const isImplemented = feature.id !== "plan";
                const isActive = feature.id === activeFeature;

                return (
                    <button
                        key={feature.id}
                        type="button"
                        className={`stock-feature-button${isActive ? " is-active" : ""}`}
                        aria-current={isActive ? "page" : undefined}
                        aria-label={isImplemented ? feature.label : `${feature.label}, fonctionnalité à venir`}
                        disabled={!isImplemented}
                        onClick={() => {
                            if (feature.id !== "plan") {
                                onSelect(feature.id);
                            }
                        }}
                    >
                        {feature.label}
                    </button>
                );
            })}
        </nav>
    );
}