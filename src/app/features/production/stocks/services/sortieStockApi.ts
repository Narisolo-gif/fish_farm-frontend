import { apiRequest } from "@/lib/apiClient";
import { getResults, type ApiListResponse } from "@/app/features/production/stocks/services/stockApi";
import type {
	ApercuSortie,
	BassinDestination,
	SortieStock,
	SortieStockPayload,
} from "@/app/features/production/stocks/types/sortieStock.types";

function getAuthHeaders() {
	const accessToken = localStorage.getItem("access_token");
	if (!accessToken) {
		throw new Error("Votre session a expiré. Veuillez vous reconnecter.");
	}
	return { Authorization: `Bearer ${accessToken}` };
}

const SORTIES = "/api/v1/effectifs/sorties-stock/";

export async function getSortiesDuLot(lotId: number) {
	return getResults(
		await apiRequest<ApiListResponse<SortieStock>>(`${SORTIES}?lot=${lotId}`, { headers: getAuthHeaders() }),
	);
}

/** Destination autorisée par le backend : bassin actif de catégorie GROSSISSEMENT. */
export async function getBassinsDestination() {
	const bassins = getResults(
		await apiRequest<ApiListResponse<BassinDestination>>("/api/v1/bassins/?categorie=GROSSISSEMENT&statut=ACTIF", {
			headers: getAuthHeaders(),
		}),
	);
	return bassins.filter((bassin) => bassin.categorie === "GROSSISSEMENT" && bassin.statut === "ACTIF");
}

export function createSortie(payload: SortieStockPayload & { id_lot: number }) {
	return apiRequest<SortieStock>(SORTIES, {
		method: "POST",
		headers: getAuthHeaders(),
		body: JSON.stringify(payload),
	});
}

/** Seul un brouillon est modifiable (Administrateur / Gestionnaire). */
export function updateSortie(id: number, payload: SortieStockPayload) {
	return apiRequest<SortieStock>(`${SORTIES}${id}/`, {
		method: "PATCH",
		headers: getAuthHeaders(),
		body: JSON.stringify(payload),
	});
}

export function getApercuSortie(id: number) {
	return apiRequest<ApercuSortie>(`${SORTIES}${id}/apercu/`, { headers: getAuthHeaders() });
}

export function validerSortie(id: number, payload: { effectif_entrant: number; justification_ecart: string }) {
	return apiRequest<SortieStock>(`${SORTIES}${id}/valider/`, {
		method: "POST",
		headers: getAuthHeaders(),
		body: JSON.stringify(payload),
	});
}

export function annulerSortie(id: number, motif: string) {
	return apiRequest<SortieStock>(`${SORTIES}${id}/annuler/`, {
		method: "POST",
		headers: getAuthHeaders(),
		body: JSON.stringify({ motif }),
	});
}
