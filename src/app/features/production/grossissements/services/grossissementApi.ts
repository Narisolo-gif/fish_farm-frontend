import { apiRequest } from "@/lib/apiClient";
import type { LotGrossissementRecord } from "@/app/features/production/grossissements/types/grossissement.types";

type ApiListResponse<T> = T[] | { results: T[] };

const LOTS_GROSSISSEMENT = "/api/v1/grossissement/lots-grossissement/";

export async function getLotsGrossissement() {
	const response = await apiRequest<ApiListResponse<LotGrossissementRecord>>(LOTS_GROSSISSEMENT, {
	});
	return Array.isArray(response) ? response : response.results;
}

export function getLotGrossissement(id: string | number) {
	return apiRequest<LotGrossissementRecord>(`${LOTS_GROSSISSEMENT}${encodeURIComponent(String(id))}/`, {
	});
}
