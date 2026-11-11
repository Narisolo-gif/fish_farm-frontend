/** Codes `TypeProvende.Type` du backend. */
export type TypeProvendeCode = "TRAITEMENT" | "DEMARRAGE" | "CROISSANCE" | "FINITION" | "GENITEURS";

export type TypeProvende = { id: number; type: TypeProvendeCode };

export type Provende = {
	id: number;
	type_provende: number;
	type_provende_libelle: string;
	reference: string;
	/** YYYY-MM-DD : aucune distribution ne peut la précéder. */
	date_creation: string;
	remarques: string;
};

export type StatutConsommation = "VALIDE" | "ANNULEE";

/** Les décimaux DRF arrivent sous forme de chaînes. */
export type Decimal = string | number;

export type ConsommationProvende = {
	id: number;
	id_bassin: number;
	reference_bassin: string;
	id_hapa: number | null;
	nom_hapa: string | null;
	id_provende: number;
	reference_provende: string;
	/** Libellé du type (ex. « Démarrage »). */
	type_provende: string;
	date_distribution: string;
	quantite_kg: Decimal;
	observation: string;
	statut: StatutConsommation;
	motif_annulation: string;
	annulee_le: string | null;
	id_user: number;
	created_at: string;
};

export type ConsommationProvendePayload = {
	id_bassin: number;
	id_hapa: number | null;
	id_provende: number;
	date_distribution: string;
	quantite_kg: string;
	observation: string;
};

export type TotalJournalier = {
	date: string;
	total_kg: Decimal;
	nombre_distributions: number;
	detail_par_type: { type_provende: string; total_kg: Decimal; nombre_distributions: number }[];
	distributions_restantes: number;
};

/** Sans hapa sur un bassin traitement/stock : une entrée par hapa actif. */
export type JoursManquantsResponse = string[] | { id_hapa: number; nom_hapa: string; jours_manquants: string[] }[];

/** Règle backend `MAX_DISTRIBUTIONS_PAR_JOUR`. */
export const MAX_DISTRIBUTIONS_PAR_JOUR = 3;

/** Règle backend (`_verifier_hapa_distribution`) : hapa obligatoire en traitement/stock, facultatif ailleurs. */
export type ProvendeHapaMode = "required" | "optional";

export function getProvendeHapaMode(categorie: string | null | undefined): ProvendeHapaMode {
	return categorie === "TRAITEMENT" || categorie === "STOCKS" ? "required" : "optional";
}

export function toKg(value: Decimal | null | undefined) {
	const number = Number(value ?? 0);
	return Number.isFinite(number) ? number : 0;
}

export function formatKg(value: Decimal | null | undefined) {
	return `${toKg(value).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} kg`;
}

/** Jour au sens du backend (TIME_ZONE = UTC). */
export function toBackendDay(date: Date) {
	return date.toISOString().slice(0, 10);
}
