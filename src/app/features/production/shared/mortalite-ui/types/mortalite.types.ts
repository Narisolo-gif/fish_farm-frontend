export type TypeEvenement = "MORTALITE" | "PERTE";
export type StatutEvenement = "VALIDE" | "ANNULEE";
export type CategorieBassin = "REPRODUCTION" | "ECLOSERIE" | "TRAITEMENT" | "STOCKS" | "GROSSISSEMENT";

export type EvenementMortalitePerte = {
	id: number;
	type_evenement: TypeEvenement;
	id_bassin: number;
	reference_bassin: string;
	id_hapa: number | null;
	nom_hapa: string | null;
	espece: string;
	quantite: number;
	date_evenement: string;
	id_cause: number | null;
	libelle_cause: string | null;
	id_categorie: number | null;
	libelle_categorie: string | null;
	justification: string;
	observation: string;
	statut: StatutEvenement | string;
	motif_annulation: string;
	annulee_le: string | null;
	id_user: number;
	created_at: string;
};

export type EvenementPayload = {
	type_evenement: TypeEvenement;
	id_bassin: number;
	id_hapa: number | null;
	espece?: string;
	quantite: number;
	date_evenement: string;
	id_cause: number | null;
	id_categorie: number | null;
	justification: string;
	observation: string;
};

export type Referentiel = { id: number; libelle: string; actif: boolean };

export type MouvementEffectif = {
	id: number;
	bassin: number;
	reference_bassin: string;
	espece: string;
	type_mouvement: string;
	sens: 1 | -1;
	quantite: number;
	date_evenement: string;
	lot_origine: number | null;
	reference_lot_origine: string | null;
	hapa: number | null;
	nom_hapa: string | null;
	lot_grossissement: number | null;
	reference_lot_grossissement: string | null;
	annule_mouvement: number | null;
	motif_annulation: string;
	saisi_par_username: string;
	saisi_le: string;
};

export type JournalHapa = { id: number; nom: string };

/** Règle backend (`_verifier_hapa`) : hapa obligatoire en traitement/stock, interdit en grossissement. */
export type HapaMode = "required" | "optional" | "forbidden";

export function getHapaMode(categorie: string | null | undefined): HapaMode {
	if (categorie === "TRAITEMENT" || categorie === "STOCKS") return "required";
	if (categorie === "GROSSISSEMENT") return "forbidden";
	return "optional";
}

export const TYPE_EVENEMENT_LABELS: Record<TypeEvenement, string> = {
	MORTALITE: "Mortalité",
	PERTE: "Perte",
};

export const TYPE_MOUVEMENT_LABELS: Record<string, string> = {
	ENTREE: "Entrée",
	SORTIE: "Sortie",
	MORTALITE: "Mortalité",
	PERTE: "Perte",
	AJUSTEMENT_POSITIF: "Ajustement positif",
	VENTE: "Vente",
	ANNULATION: "Annulation",
};

export const ESPECE_LABELS: Record<string, string> = {
	CARPE: "Carpe",
	TILAPIA: "Tilapia",
};

export function especeLabel(espece: string) {
	return ESPECE_LABELS[espece] ?? espece;
}

/** Σ(sens × quantité) : même calcul que `apps/effectifs/calculs.py`. */
export function sommeEffectif(mouvements: Pick<MouvementEffectif, "sens" | "quantite">[]) {
	return mouvements.reduce((total, mouvement) => total + mouvement.sens * mouvement.quantite, 0);
}

/** Ordre chronologique du registre (date, puis heure de saisie, puis id). */
export function compareMouvements(a: MouvementEffectif, b: MouvementEffectif) {
	return (
		a.date_evenement.localeCompare(b.date_evenement) ||
		a.saisi_le.localeCompare(b.saisi_le) ||
		a.id - b.id
	);
}
