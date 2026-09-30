export type StockFeature =
	| "mortalite"
	| "provende"
	| "plan"
	| "environnement"
	| "cloture"
	| "historique-sortie";

export type StockSection = Exclude<StockFeature, "plan">;
