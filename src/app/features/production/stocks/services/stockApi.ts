import { apiRequest } from "@/lib/apiClient";

export type StockHapa = {
	id_hapa: number;
	nom_hapa: string;
	effectif_entrant: number;
};

/** `MiseEnStock.Finalite` : obligatoire à la création, non modifiable ensuite. */
export type FinaliteStock = "GROSSISSEMENT" | "VENTE";

export type StockRecord = {
	id: number;
	id_lot: number;
	reference_lot: string;
	id_bassin: number;
	reference_bassin: string;
	finalite: FinaliteStock | null;
	hapas: StockHapa[];
	effectif_entrant: number;
	ecart_effectif: number | null;
	date_mise_en_stock: string;
	justification_ecart: string;
	observation: string;
};

export type StockLot = {
	id: number;
	reference: string;
	quantite_initiale: number;
	stade: "CREEE" | "EN_TRAITEMENT" | "EN_STOCK" | "CLOTUREE" | string;
};

export type StockBassin = {
	id: number;
	reference: string;
	categorie: string;
	statut: string;
	hapas: {
		id: number;
		nom: string;
		actif: boolean;
		statut: string;
	}[];
};

export type StockTreatment = {
	id_lot: number;
	effectif_final: number | null;
	statut: string;
};

export type ApiListResponse<T> = T[] | { results: T[] };

export function getResults<T>(response: ApiListResponse<T>): T[] {
	return Array.isArray(response) ? response : response.results;
}

function getAuthHeaders() {
	const accessToken = localStorage.getItem("access_token");
	if (!accessToken) {
		throw new Error("Votre session a expiré. Veuillez vous reconnecter.");
	}

	return { Authorization: `Bearer ${accessToken}` };
}

export async function getStockHistory() {
	return getResults(
		await apiRequest<ApiListResponse<StockRecord>>("/api/v1/stocks/", {
			headers: getAuthHeaders(),
		}),
	);
}

/** Mise en stock d'un lot (au plus une par lot) ; l'API ne filtre pas par lot. */
export async function getMiseEnStockDuLot(lotId: number) {
	const stocks = await getStockHistory();
	return stocks.find((stock) => stock.id_lot === lotId) ?? null;
}

export async function getStockDetail(stockId: string) {
	return apiRequest<StockRecord>(
		`/api/v1/stocks/${encodeURIComponent(stockId)}/`,
		{ headers: getAuthHeaders() },
	);
}

export async function getStockFormOptions() {
	const headers = getAuthHeaders();
	const [lotsResponse, basinsResponse, treatmentsResponse] = await Promise.all([
		apiRequest<ApiListResponse<StockLot>>("/api/v1/lots/", { headers }),
		apiRequest<ApiListResponse<StockBassin>>(
			"/api/v1/bassins/?categorie=STOCKS&statut=ACTIF",
			{ headers },
		),
		apiRequest<ApiListResponse<StockTreatment>>("/api/v1/traitement/", { headers }),
	]);

	return {
		lots: getResults(lotsResponse),
		basins: getResults(basinsResponse).filter(
			(basin) => basin.categorie === "STOCKS" && basin.statut === "ACTIF",
		),
		treatments: getResults(treatmentsResponse),
	};
}

export async function createStock(payload: {
	id_lot: number;
	id_bassin: number;
	finalite: FinaliteStock;
	effectif_entrant?: number;
	hapas?: { id_hapa: number; effectif_entrant: number }[];
	justification_ecart: string;
	observation: string;
}) {
	return apiRequest<StockRecord>("/api/v1/stocks/", {
		method: "POST",
		headers: getAuthHeaders(),
		body: JSON.stringify(payload),
	});
}
