export type TraitementFeature =
	| "mortalite"
	| "provende"
	| "plan"
	| "environnement"
	| "cloture";

export type TraitementSection = Extract<TraitementFeature, "mortalite" | "provende" | "environnement" | "cloture">;

export type MortaliteRecord = {
	id: string;
	date: string;
	deaths: number;
	observation: string;
};

export type TraitementDetailData = {
	reference_lot: string;
	statut: "EN_COURS" | "CLOTUREE";
};