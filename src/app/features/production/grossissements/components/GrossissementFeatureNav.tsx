import type {
  GrossissementFeature,
  GrossissementSection,
} from "@/app/features/production/grossissements/types/grossissement.types";

type GrossissementNavItem =
  | { id: GrossissementSection; label: string; enabled: true }
  | { id: Exclude<GrossissementFeature, GrossissementSection>; label: string; enabled: false };

const features: GrossissementNavItem[] = [
  { id: "mortalite", label: "Mortalité", enabled: true },
  { id: "pesees", label: "Pesées", enabled: true },
  { id: "provende", label: "Consommation en provende", enabled: true },
  { id: "environnement", label: "Paramètres environnementaux", enabled: true },
  { id: "dashboard", label: "Dashboard", enabled: true },
];

export function GrossissementFeatureNav({
  activeFeature,
  onSelect,
}: {
  activeFeature: GrossissementSection;
  onSelect: (feature: GrossissementSection) => void;
}) {
  return (
    <nav className="treatment-feature-nav" aria-label="Fonctionnalités du grossissement">
      {features.map((feature) => {
        const isActive = feature.id === activeFeature;

        return (
          <button
            key={feature.id}
            type="button"
            className={`treatment-feature-button${isActive ? " is-active" : ""}`}
            aria-current={isActive ? "page" : undefined}
            aria-label={feature.enabled ? feature.label : `${feature.label}, fonctionnalité à venir`}
            disabled={!feature.enabled}
            onClick={() => {
              if (feature.enabled) {
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