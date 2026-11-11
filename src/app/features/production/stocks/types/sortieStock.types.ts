export type StatutSortieStock = "BROUILLON" | "VALIDEE" | "ANNULEE";

export const STATUT_SORTIE_LABELS: Record<StatutSortieStock, string> = {
	BROUILLON: "Brouillon",
	VALIDEE: "Validée",
	ANNULEE: "Annulée",
};

/** Seul type de sortie géré par le backend (`SortieStock.TypeSortie`). */
export const TYPE_SORTIE_LABELS: Record<string, string> = {
	GROSSISSEMENT: "Grossissement",
};

export type SortieStockLigne = { id_hapa: number; nom_hapa: string; quantite: number };

export type SortieStock = {
	id: number;
	type_sortie: string;
	id_lot: number;
	reference_lot: string;
	espece: string;
	id_bassin_source: number | null;
	id_bassin_destination: number;
	reference_bassin_source: string | null;
	reference_bassin_destination: string;
	date_sortie: string;
	statut: StatutSortieStock;
	observation: string;
	effectif_sortant: number | null;
	effectif_entrant: number | null;
	ecart_effectif: number | null;
	justification_ecart: string;
	lignes: SortieStockLigne[];
	id_user: number;
	validee_le: string | null;
	annulee_le: string | null;
	motif_annulation: string;
	created_at: string;
};

export type SortieStockPayload = {
	id_bassin_destination: number;
	date_sortie: string;
	observation: string;
};

export type ApercuSortie = {
	lignes: SortieStockLigne[];
	effectif_sortant: number;
	effectif_entrant: number;
	ecart_effectif: number;
};

export type BassinDestination = { id: number; reference: string; categorie: string; statut: string };
