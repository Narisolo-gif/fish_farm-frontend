import { apiRequest } from "@/lib/apiClient";
import type {
	ConsommationProvende,
	ConsommationProvendePayload,
	JoursManquantsResponse,
	Provende,
	TotalJournalier,
	TypeProvende,
} from "@/app/features/production/shared/provende-ui/types/provende.types";

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

function query(params: Record<string, string | number | null | undefined>) {
	const search = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value !== null && value !== undefined && value !== "") {
			search.set(key, String(value));
		}
	}
	const text = search.toString();
	return text ? `?${text}` : "";
}

async function getList<T>(endpoint: string) {
	return getResults(await apiRequest<ApiListResponse<T>>(endpoint, { headers: getAuthHeaders() }));
}

const CONSOMMATIONS = "/api/v1/provende/consommations-provende/";

export function getProvendes() {
	return getList<Provende>("/api/v1/provende/");
}

export function getTypesProvende() {
	return getList<TypeProvende>("/api/v1/provende/types/");
}

export function getConsommations(filters: { bassin: number; hapa?: number; date_min?: string }) {
	return getList<ConsommationProvende>(`${CONSOMMATIONS}${query(filters)}`);
}

export function createConsommation(payload: ConsommationProvendePayload) {
	return apiRequest<ConsommationProvende>(CONSOMMATIONS, {
		method: "POST",
		headers: getAuthHeaders(),
		body: JSON.stringify(payload),
	});
}

export function annulerConsommation(id: number, motif: string) {
	return apiRequest<ConsommationProvende>(`${CONSOMMATIONS}${id}/annuler/`, {
		method: "POST",
		headers: getAuthHeaders(),
		body: JSON.stringify({ motif }),
	});
}

export class CorrectionPartielleError extends Error {
	cause: unknown;
	constructor(cause: unknown) {
		super(
			`La distribution d'origine a été annulée, mais la nouvelle saisie a échoué : ${
				cause instanceof Error ? cause.message : "erreur inconnue"
			} Corrigez le formulaire puis enregistrez-le comme nouvelle distribution.`,
		);
		this.name = "CorrectionPartielleError";
		this.cause = cause;
	}
}

/**
 * Le backend interdit la modification d'une distribution : on l'annule (motif obligatoire)
 * puis on enregistre la version corrigée. L'annulation passe en premier pour libérer
 * le créneau du plafond journalier et la contrainte d'unicité à la minute.
 */
export async function corrigerConsommation(id: number, motif: string, payload: ConsommationProvendePayload) {
	await annulerConsommation(id, motif);
	try {
		return await createConsommation(payload);
	} catch (error) {
		throw new CorrectionPartielleError(error);
	}
}

type PeriodeFilters = { bassin: number; hapa?: number | null; date_min: string; date_max: string };

export function getTotauxJournaliers(filters: PeriodeFilters) {
	return apiRequest<TotalJournalier[]>(`${CONSOMMATIONS}totaux-journaliers/${query(filters)}`, {
		headers: getAuthHeaders(),
	});
}

export function getJoursManquants(filters: PeriodeFilters) {
	return apiRequest<JoursManquantsResponse>(`${CONSOMMATIONS}jours-manquants/${query(filters)}`, {
		headers: getAuthHeaders(),
	});
}
