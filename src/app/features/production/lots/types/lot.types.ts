export type LotStade = "CREEE" | "EN_TRAITEMENT" | "EN_STOCK" | "EN_GROSSISSEMENT" | "CLOTUREE";
export type LotParcours = "TRAITEMENT_REQUIS" | "SANS_TRAITEMENT";
export type LotEspece = "CARPE" | "TILAPIA";

export type LotRecord = {
	id: number;
	reference: string;
	id_eclosion: number;
	reference_eclosion: string;
	date_creation: string;
	espece: LotEspece | string;
	id_utilisateur_createur: number;
	quantite_initiale: number;
	parcours_production: LotParcours;
	stade: LotStade;
	observations: string;
	created_at: string;
	updated_at: string;
};

export type LotEclosion = {
	id: number;
	reference: string;
	reference_ponte: string;
	date_eclosion: string;
	quantite_alevins_obtenu: number;
	statut: "ACTIF" | "INACTIF" | string;
};

export type MouvementEffectif = {
	id: number;
	type_mouvement:
		| "ENTREE"
		| "SORTIE"
		| "MORTALITE"
		| "PERTE"
		| "AJUSTEMENT_POSITIF"
		| "VENTE"
		| "ANNULATION"
		| string;
	sens: 1 | -1;
	quantite: number;
	lot_origine: number | null;
	annule_mouvement: number | null;
};

export type LotEffectif = {
	/** Effectif vivant actuel selon le registre des mouvements (quantité initiale tant que le lot n'est pas placé). */
	vivant: number;
	mortalite: number;
	perte: number;
	/** false tant qu'aucun mouvement n'est rattaché au lot (stade « Créé »). */
	aDesMouvements: boolean;
};

/**
 * Le registre `effectifs` ne stocke pas d'effectif : il se calcule par Σ(sens × quantité).
 * Les mouvements annulés et leurs annulations sont exclus des totaux de mortalité et de perte.
 */
export function computeLotEffectif(lot: Pick<LotRecord, "id" | "quantite_initiale">, mouvements: MouvementEffectif[]): LotEffectif {
	const duLot = mouvements.filter((mouvement) => mouvement.lot_origine === lot.id);
	if (duLot.length === 0) {
		return { vivant: lot.quantite_initiale, mortalite: 0, perte: 0, aDesMouvements: false };
	}

	const annules = new Set(
		duLot.flatMap((mouvement) => (mouvement.annule_mouvement === null ? [] : [mouvement.annule_mouvement])),
	);
	const totalPour = (type: string) =>
		duLot
			.filter((mouvement) => mouvement.type_mouvement === type && !annules.has(mouvement.id))
			.reduce((total, mouvement) => total + mouvement.quantite, 0);

	return {
		vivant: duLot.reduce((total, mouvement) => total + mouvement.sens * mouvement.quantite, 0),
		mortalite: totalPour("MORTALITE"),
		perte: totalPour("PERTE"),
		aDesMouvements: true,
	};
}

export type LotCreatePayload = {
	reference: string;
	id_eclosion: number;
	date_creation: string;
	parcours_production: LotParcours;
	observations: string;
};

export type LotUpdatePayload = Pick<LotCreatePayload, "reference" | "date_creation" | "observations">;

export const LOT_STADE_LABELS: Record<LotStade, string> = {
	CREEE: "Créé",
	EN_TRAITEMENT: "En traitement",
	EN_STOCK: "En stock",
	EN_GROSSISSEMENT: "En grossissement",
	CLOTUREE: "Clôturé",
};

export const LOT_STADE_BADGES: Record<LotStade, string> = {
	CREEE: "badge-green",
	EN_TRAITEMENT: "badge-amber",
	EN_STOCK: "badge-blue",
	EN_GROSSISSEMENT: "badge-blue",
	CLOTUREE: "",
};

export const LOT_PARCOURS_LABELS: Record<LotParcours, string> = {
	TRAITEMENT_REQUIS: "Traitement requis",
	SANS_TRAITEMENT: "Sans traitement",
};

export const LOT_ESPECE_LABELS: Record<string, string> = {
	CARPE: "Carpe",
	TILAPIA: "Tilapia",
};

export function getStadeLabel(stade: string) {
	return LOT_STADE_LABELS[stade as LotStade] ?? stade;
}

export function getStadeBadgeClass(stade: string) {
	return `badge ${LOT_STADE_BADGES[stade as LotStade] ?? ""}`.trim();
}

/** Règles du backend : un lot clôturé n'est plus modifiable ni clôturable. */
export function canEditLot(lot: Pick<LotRecord, "stade">) {
	return lot.stade !== "CLOTUREE";
}

export function canCloseLot(lot: Pick<LotRecord, "stade">) {
	return lot.stade !== "CLOTUREE";
}

/**
 * Traitement, mise en stock, mouvements d'effectifs et grossissement protègent le lot
 * (on_delete=PROTECT) : seul un lot encore au stade « Créé » peut être supprimé.
 */
export function canDeleteLot(lot: Pick<LotRecord, "stade">) {
	return lot.stade === "CREEE";
}

/** Étapes du cycle de vie selon le parcours (pas de traitement pour SANS_TRAITEMENT). */
export function getLotSteps(parcours: string): LotStade[] {
	return parcours === "SANS_TRAITEMENT"
		? ["CREEE", "EN_STOCK", "EN_GROSSISSEMENT", "CLOTUREE"]
		: ["CREEE", "EN_TRAITEMENT", "EN_STOCK", "EN_GROSSISSEMENT", "CLOTUREE"];
}
