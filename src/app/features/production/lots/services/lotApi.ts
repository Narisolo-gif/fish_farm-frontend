import { apiRequest } from "@/lib/apiClient";
import {
	computeLotEffectif,
	type LotCreatePayload,
	type LotEclosion,
	type LotRecord,
	type LotUpdatePayload,
	type MouvementEffectif,
} from "@/app/features/production/lots/types/lot.types";

type ApiListResponse<T> = T[] | { results: T[] };

function getResults<T>(response: ApiListResponse<T>): T[] {
	return Array.isArray(response) ? response : response.results;
}

function getAuthHeaders() {
	const accessToken = localStorage.getItem("access_token");
	if (!accessToken) {
		throw new Error("Votre session a expiré. Veuillez vous reconnecter.");
	}

	return { Authorization: `Bearer ${accessToken}` };
}

function lotUrl(lotId: number | string) {
	return `/api/v1/lots/${encodeURIComponent(String(lotId))}/`;
}

export async function getLots() {
	return getResults(
		await apiRequest<ApiListResponse<LotRecord>>("/api/v1/lots/", { headers: getAuthHeaders() }),
	);
}

export async function getLot(lotId: number | string) {
	return apiRequest<LotRecord>(lotUrl(lotId), { headers: getAuthHeaders() });
}

/**
 * L'API des mouvements ne filtre pas par lot : on récupère le registre et on filtre sur `lot_origine`
 * (voir `computeLotEffectif`).
 */
export async function getLotEffectif(lot: Pick<LotRecord, "id" | "quantite_initiale">) {
	const mouvements = getResults(
		await apiRequest<ApiListResponse<MouvementEffectif>>("/api/v1/effectifs/", { headers: getAuthHeaders() }),
	);
	return computeLotEffectif(lot, mouvements);
}

export async function getEclosions() {
	return getResults(
		await apiRequest<ApiListResponse<LotEclosion>>("/api/v1/ecloserie/", { headers: getAuthHeaders() }),
	);
}

/** Éclosions actives qui n'ont pas encore donné de lot (relation OneToOne côté backend). */
export async function getAvailableEclosions() {
	const [eclosions, lots] = await Promise.all([getEclosions(), getLots()]);
	const usedReferences = new Set(lots.map((lot) => lot.reference_eclosion));
	return eclosions.filter(
		(eclosion) => eclosion.statut === "ACTIF" && !usedReferences.has(eclosion.reference),
	);
}

export async function createLot(payload: LotCreatePayload) {
	return apiRequest<LotRecord>("/api/v1/lots/", {
		method: "POST",
		headers: getAuthHeaders(),
		body: JSON.stringify(payload),
	});
}

export async function updateLot(lotId: number | string, payload: LotUpdatePayload) {
	return apiRequest<LotRecord>(lotUrl(lotId), {
		method: "PATCH",
		headers: getAuthHeaders(),
		body: JSON.stringify(payload),
	});
}

export async function cloturerLot(lotId: number | string) {
	return apiRequest<{ detail: string; id: number; reference: string; stade: LotRecord["stade"] }>(
		`${lotUrl(lotId)}cloturer/`,
		{ method: "PATCH", headers: getAuthHeaders() },
	);
}

export async function deleteLot(lotId: number | string) {
	await apiRequest<null>(lotUrl(lotId), { method: "DELETE", headers: getAuthHeaders() });
}
