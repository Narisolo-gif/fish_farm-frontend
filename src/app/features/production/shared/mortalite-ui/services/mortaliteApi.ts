import { apiRequest } from "@/lib/apiClient";
import type {
	EvenementMortalitePerte,
	EvenementPayload,
	MouvementEffectif,
	Referentiel,
} from "@/app/features/production/shared/mortalite-ui/types/mortalite.types";

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

const EVENEMENTS = "/api/v1/effectifs/evenements-mortalite-perte/";

export function getEvenements(filters: { bassin: number; date_min?: string }) {
	return getList<EvenementMortalitePerte>(`${EVENEMENTS}${query(filters)}`);
}

export function getCauses() {
	return getList<Referentiel>("/api/v1/effectifs/causes-mortalite/?actif=true");
}

export function getCategories() {
	return getList<Referentiel>("/api/v1/effectifs/categories-perte/?actif=true");
}

export function createEvenement(payload: EvenementPayload) {
	return apiRequest<EvenementMortalitePerte>(EVENEMENTS, {
		method: "POST",
		headers: getAuthHeaders(),
		body: JSON.stringify(payload),
	});
}

export function annulerEvenement(id: number, motif: string) {
	return apiRequest<EvenementMortalitePerte>(`${EVENEMENTS}${id}/annuler/`, {
		method: "POST",
		headers: getAuthHeaders(),
		body: JSON.stringify({ motif }),
	});
}

export class CorrectionPartielleError extends Error {
	cause: unknown;
	constructor(cause: unknown) {
		super(
			`L'événement d'origine a été annulé, mais la nouvelle saisie a échoué : ${
				cause instanceof Error ? cause.message : "erreur inconnue"
			} Corrigez le formulaire puis enregistrez-le comme nouvel événement.`,
		);
		this.name = "CorrectionPartielleError";
		this.cause = cause;
	}
}

/**
 * Le backend interdit la modification d'un événement : on l'annule (motif obligatoire)
 * puis on enregistre la version corrigée. L'annulation passe en premier pour libérer
 * l'effectif contrôlé par le backend à la création.
 */
export async function corrigerEvenement(id: number, motif: string, payload: EvenementPayload) {
	await annulerEvenement(id, motif);
	try {
		return await createEvenement(payload);
	} catch (error) {
		throw new CorrectionPartielleError(error);
	}
}

export function getMouvements(filters: { bassin: number }) {
	return getList<MouvementEffectif>(`/api/v1/effectifs/${query(filters)}`);
}
