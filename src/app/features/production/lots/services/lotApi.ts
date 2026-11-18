import { listResults } from "@/lib/formatters";
import { apiRequest } from "@/lib/apiClient";
import {
	computeLotEffectif,
	type LotCreatePayload,
	type LotEclosion,
	type LotRecord,
	type LotUpdatePayload,
} from "@/app/features/production/lots/types/lot.types";
import type { MouvementEffectif } from "@/app/features/production/shared/mortalite-ui/types/mortalite.types";

type ApiListResponse<T> = T[] | { results: T[] };

function lotUrl(lotId: number | string) {
	return `/api/v1/lots/${encodeURIComponent(String(lotId))}/`;
}

export async function getLots() {
	return listResults(
		await apiRequest<ApiListResponse<LotRecord>>("/api/v1/lots/"),
	);
}

export async function getLot(lotId: number | string) {
	return apiRequest<LotRecord>(lotUrl(lotId));
}

/**
 * L'API des mouvements ne filtre pas par lot : on récupère le registre et on filtre sur `lot_origine`
 * (voir `computeLotEffectif`).
 */
export async function getLotEffectif(lot: Pick<LotRecord, "id" | "quantite_initiale">) {
	const mouvements = listResults(
		await apiRequest<ApiListResponse<MouvementEffectif>>("/api/v1/effectifs/"),
	);
	return computeLotEffectif(lot, mouvements);
}

export async function getEclosions() {
	return listResults(
		await apiRequest<ApiListResponse<LotEclosion>>("/api/v1/ecloserie/"),
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
		body: JSON.stringify(payload),
	});
}

export async function updateLot(lotId: number | string, payload: LotUpdatePayload) {
	return apiRequest<LotRecord>(lotUrl(lotId), {
		method: "PATCH",
		body: JSON.stringify(payload),
	});
}

export async function cloturerLot(lotId: number | string) {
	return apiRequest<{ detail: string; id: number; reference: string; stade: LotRecord["stade"] }>(
		`${lotUrl(lotId)}cloturer/`,
		{ method: "PATCH" },
	);
}

export async function deleteLot(lotId: number | string) {
	await apiRequest<null>(lotUrl(lotId), { method: "DELETE" });
}
