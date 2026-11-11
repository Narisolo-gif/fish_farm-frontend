export type GrossissementFeature =
  | "mortalite"
  | "pesees"
  | "provende"
  | "environnement"
  | "dashboard"
  | "cloture";

export type LotGrossissementRecord = {
  id: number;
  code: string;
  id_lot_origine: number;
  reference_lot_origine: string;
  id_bassin: number;
  reference_bassin: string;
  espece: string;
  date_mise_en_place: string;
  effectif_initial: number;
  statut: "ACTIF" | "CLOTURE" | string;
  date_cloture: string | null;
  age_jours: number | null;
  etape_courante: string | null;
  observation: string;
};

export type GrossissementSection = Extract<
  GrossissementFeature,
  "mortalite" | "pesees" | "provende" | "environnement" | "dashboard"
>;