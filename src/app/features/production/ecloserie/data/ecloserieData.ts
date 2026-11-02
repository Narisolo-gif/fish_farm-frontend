export type EclosionRecord = {
	reference: string;
	ponteReference: string;
	hatchingDate: string;
	fryQuantity: number;
	hatchedEggQuantity: number | null;
	observation: string;
};

export type ApiEclosionRecord = {
	id: number;
	reference: string;
	reference_ponte: string;
	date_eclosion: string;
	quantite_oeufs_eclos: number | string | null;
	quantite_alevins_obtenu: number;
	observation: string | null;
};

export function isEclosionRecord(value: unknown): value is EclosionRecord {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const record = value as Record<string, unknown>;
	return (
		typeof record.reference === "string" &&
		typeof record.ponteReference === "string" &&
		typeof record.hatchingDate === "string" &&
		typeof record.fryQuantity === "number" &&
		(record.hatchedEggQuantity === null || typeof record.hatchedEggQuantity === "number") &&
		typeof record.observation === "string"
	);
}
