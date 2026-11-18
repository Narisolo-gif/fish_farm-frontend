import { apiRequest } from "@/lib/apiClient";
import { getResults, type ApiListResponse } from "@/app/features/production/stocks/services/stockApi";
import type {
	ApercuSortie,
	BassinDestination,
	SortieStock,
	SortieStockPayload,
} from "@/app/features/production/stocks/types/sortieStock.types";

const SORTIES = "/api/v1/effectifs/sorties-stock/";

export async function getSortiesDuLot(lotId: number) {
	return getResults(
		await apiRequest<ApiListResponse<SortieStock>>(`${SORTIES}?lot=${lotId}`),
	);
}

/** Destination autorisée par le backend : bassin actif de catégorie GROSSISSEMENT. */
export async function getBassinsDestination() {
	const bassins = getResults(
		await apiRequest<ApiListResponse<BassinDestination>>("/api/v1/bassins/?categorie=GROSSISSEMENT&statut=ACTIF", {
		}),
	);
	return bassins.filter((bassin) => bassin.categorie === "GROSSISSEMENT" && bassin.statut === "ACTIF");
}

export function createSortie(payload: SortieStockPayload & { id_lot: number }) {
	return apiRequest<SortieStock>(SORTIES, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

/** Seul un brouillon est modifiable (Administrateur / Gestionnaire). */
export function updateSortie(id: number, payload: SortieStockPayload) {
	return apiRequest<SortieStock>(`${SORTIES}${id}/`, {
		method: "PATCH",
		body: JSON.stringify(payload),
	});
}

export function getApercuSortie(id: number) {
	return apiRequest<ApercuSortie>(`${SORTIES}${id}/apercu/`);
}

export function validerSortie(id: number, payload: { effectif_entrant: number; justification_ecart: string }) {
	return apiRequest<SortieStock>(`${SORTIES}${id}/valider/`, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export function annulerSortie(id: number, motif: string) {
	return apiRequest<SortieStock>(`${SORTIES}${id}/annuler/`, {
		method: "POST",
		body: JSON.stringify({ motif }),
	});
}
