import { apiRequest } from "@/lib/apiClient";
import type { LotGrossissementRecord } from "@/app/features/production/grossissements/types/grossissement.types";

type ApiListResponse<T> = T[] | { results: T[] };

function getAuthHeaders() {
	const accessToken = localStorage.getItem("access_token");
	if (!accessToken) {
		throw new Error("Votre session a expiré. Veuillez vous reconnecter.");
	}
	return { Authorization: `Bearer ${accessToken}` };
}

const LOTS_GROSSISSEMENT = "/api/v1/grossissement/lots-grossissement/";

export async function getLotsGrossissement() {
	const response = await apiRequest<ApiListResponse<LotGrossissementRecord>>(LOTS_GROSSISSEMENT, {
		headers: getAuthHeaders(),
	});
	return Array.isArray(response) ? response : response.results;
}

export function getLotGrossissement(id: string | number) {
	return apiRequest<LotGrossissementRecord>(`${LOTS_GROSSISSEMENT}${encodeURIComponent(String(id))}/`, {
		headers: getAuthHeaders(),
	});
}
