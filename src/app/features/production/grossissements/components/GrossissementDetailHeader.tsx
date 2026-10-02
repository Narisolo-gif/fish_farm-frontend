import { PageHeader } from "@/components/PageHeader";
import { GrossissementFeatureNav } from "@/app/features/production/grossissements/components/GrossissementFeatureNav";
import type { GrossissementSection } from "@/app/features/production/grossissements/types/grossissement.types";

export function GrossissementDetailHeader({
  activeFeature,
  currentDate,
  onFeatureChange,
}: {
  activeFeature: GrossissementSection;
  currentDate: string;
  onFeatureChange: (feature: GrossissementSection) => void;
}) {
  return (
    <>
      <PageHeader eyebrow="Production" title="Suivi du grossissement" />
      <dl className="treatment-meta">
        <div>
          <dt>Grossissement</dt>
          <dd>Cycle actuel</dd>
        </div>
        <div>
          <dt>Référence</dt>
          <dd>—</dd>
        </div>
        <div>
          <dt>Statut</dt>
          <dd><span className="badge badge-green">En cours</span></dd>
        </div>
        <div>
          <dt>Date d'entrée en grossissement</dt>
          <dd>—</dd>
        </div>
        <div>
          <dt>Stade</dt>
          <dd>{currentDate || "—"}</dd>
        </div>
      </dl>
      <GrossissementFeatureNav
        activeFeature={activeFeature}
        onSelect={onFeatureChange}
      />
    </>
  );
}