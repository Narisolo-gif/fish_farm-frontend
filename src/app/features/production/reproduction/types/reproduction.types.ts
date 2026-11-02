export type ReproductionBasin = {
	id: number;
	reference: string;
	categorie: "REPRODUCTION";
	capacity: number;
	statut: "ACTIF" | "INACTIF";
};

export type ReproductionRecord = {
	id: number;
	reference: string;
	bassin: number;
	espece: "CARPE" | "TILAPIA";
	date_ajout: string;
	quantite_male: number;
	quantite_femelle: number;
	observation: string;
	statut: "ACTIF" | "INACTIF";
};

export type PonteRecord = {
	id: number;
	reference: string;
	reproduction: number;
	date_ponte: string;
	quantite_oeuf_obtenu: number | string;
	observation: string;
};

export type ReproductionInput = Omit<
	ReproductionRecord,
	"id" | "statut"
>;

export type PonteInput = {
	reference: string;
	bassin: number;
	date_ponte: string;
	quantite_oeuf_obtenu: number;
	observation: string;
};
