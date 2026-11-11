export type TraitementFeature =
	| "mortalite"
	| "provende"
	| "plan"
	| "environnement"
	| "cloture"
	| "historique-sortie";

export type TraitementSection = TraitementFeature;

export type TraitementDetailData = {
	id: number;
	id_lot: number;
	reference_lot: string;
	id_bassin: number;
	reference_bassin: string;
	date_ouverture: string;
	statut: "EN_COURS" | "CLOTUREE";
	hapas: { id_hapa: number; nom_hapa: string; effectif_initial: number; effectif_final: number | null }[];
};