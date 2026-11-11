import { PageHeader } from "@/components/PageHeader";
import { GrossissementFeatureNav } from "@/app/features/production/grossissements/components/GrossissementFeatureNav";
import type {
  GrossissementSection,
  LotGrossissementRecord,
} from "@/app/features/production/grossissements/types/grossissement.types";

export function GrossissementDetailHeader({
  lot,
  isLoading,
  activeFeature,
  currentDate,
  onFeatureChange,
}: {
  lot: LotGrossissementRecord | null;
  isLoading: boolean;
  activeFeature: GrossissementSection;
  currentDate: string;
  onFeatureChange: (feature: GrossissementSection) => void;
}) {
  const pending = isLoading ? "Chargement..." : "—";
  const isClosed = lot?.statut === "CLOTURE";

  return (
    <>
      <PageHeader eyebrow="Production" title="Suivi du grossissement" />
      <dl className="treatment-meta">
        <div>
          <dt>Grossissement</dt>
          <dd>{lot?.code ?? pending}</dd>
        </div>
        <div>
          <dt>Lot d&apos;origine</dt>
          <dd>{lot?.reference_lot_origine ?? pending}</dd>
        </div>
        <div>
          <dt>Statut</dt>
          <dd>
            {lot ? (
              <span className={`badge ${isClosed ? "badge-amber" : "badge-green"}`}>{isClosed ? "Clôturé" : "En cours"}</span>
            ) : pending}
          </dd>
        </div>
        <div>
          <dt>Bassin</dt>
          <dd>{lot?.reference_bassin ?? pending}</dd>
        </div>
        <div>
          <dt>Date d&apos;entrée en grossissement</dt>
          <dd>{lot ? new Date(lot.date_mise_en_place).toLocaleDateString("fr-FR") : pending}</dd>
        </div>
        <div>
          <dt>Aujourd&apos;hui</dt>
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
