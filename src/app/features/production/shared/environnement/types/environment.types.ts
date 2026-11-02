export type EnvironmentalBasin = {
	id: number;
	reference: string;
	categorie: "REPRODUCTION" | "ECLOSERIE" | "TRAITEMENT" | "STOCKS" | "GROSSISSEMENT";
	statut: string;
};

export type EnvironmentalMeasurement = {
	id: number;
	bassin: number;
	date_heure_prelevement: string;
	temperature_eau: number | string;
	temperature_air: number | string;
	oxygene: number | string;
	ph: number | string;
	nitrite: number | string;
	nitrate: number | string;
	ammoniac: number | string;
};

export type EnvironmentalMeasurementInput = Omit<EnvironmentalMeasurement, "id">;

export type ApiListResponse<T> = T[] | { results: T[] };

export function getApiResults<T>(response: ApiListResponse<T>): T[] {
	return Array.isArray(response) ? response : response.results;
}
