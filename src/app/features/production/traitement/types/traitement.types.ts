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