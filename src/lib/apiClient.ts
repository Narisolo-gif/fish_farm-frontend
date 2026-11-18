import { toApiError } from "./apiErrors";
import { clearSession, getAccessToken, getRefreshToken, setTokens } from "./session";

export { ApiError, type ApiFieldErrors } from "./apiErrors";

const API_URL =
	process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const ROUTES_SANS_REFRESH = ["/api/auth/login/", "/api/auth/refresh/"];

export type ApiRequestOptions = RequestInit & {
	/** Ajoute le jeton et rafraîchit sur 401 (vrai par défaut). */
	auth?: boolean;
};

async function lireCorps(response: Response): Promise<unknown> {
	if (response.status === 204) {
		return null;
	}
	const texte = await response.text().catch(() => "");
	if (!texte) {
		return null;
	}
	try {
		return JSON.parse(texte);
	} catch {
		return null;
	}
}

function envoyer(endpoint: string, options: ApiRequestOptions, jeton: string | null): Promise<Response> {
	const { auth, headers, ...reste } = options;
	const entetes: Record<string, string> = {
		"Content-Type": "application/json",
		...(auth !== false && jeton ? { Authorization: `Bearer ${jeton}` } : {}),
		...((headers as Record<string, string> | undefined) ?? {}),
	};
	return fetch(`${API_URL}${endpoint}`, { ...reste, headers: entetes });
}

/**
 * Résultat d'un refresh : le nouveau jeton, `null` si le backend refuse le refresh (session finie),
 * ou `"indisponible"` (réseau, 5xx) : la session est gardée, la requête échoue sans déconnexion.
 */
type ResultatRefresh = string | null | "indisponible";

/** Refresh en cours, partagé par toutes les requêtes qui reçoivent un 401 en même temps. */
let refreshEnCours: Promise<ResultatRefresh> | null = null;

async function rafraichir(): Promise<ResultatRefresh> {
	const refresh = getRefreshToken();
	if (!refresh) {
		return null;
	}
	const response = await envoyer(
		"/api/auth/refresh/",
		{ method: "POST", auth: false, body: JSON.stringify({ refresh }) },
		null,
	).catch(() => null);
	if (!response) {
		return "indisponible";
	}
	if (!response.ok) {
		return response.status === 400 || response.status === 401 ? null : "indisponible";
	}
	const data = (await lireCorps(response)) as { access?: string; refresh?: string } | null;
	if (!data?.access) {
		return null;
	}
	setTokens(data.access, data.refresh ?? refresh);
	return data.access;
}

function rafraichirUneFois(): Promise<ResultatRefresh> {
	refreshEnCours ??= rafraichir().finally(() => {
		refreshEnCours = null;
	});
	return refreshEnCours;
}

function finDeSession(): void {
	clearSession();
	if (typeof window !== "undefined") {
		// Hors composant React (pas de routeur) ; un rechargement complet vide aussi l'état en mémoire.
		// eslint-disable-next-line @next/next/no-location-assign-relative-destination
		window.location.assign("/login");
	}
}

export async function apiRequest<T>(
	endpoint: string,
	options: ApiRequestOptions = {},
): Promise<T> {
	const auth = options.auth !== false;
	let response = await envoyer(endpoint, options, getAccessToken());

	if (response.status === 401 && auth && !ROUTES_SANS_REFRESH.includes(endpoint)) {
		const resultat = await rafraichirUneFois();
		if (resultat === null) {
			finDeSession();
		} else if (resultat !== "indisponible") {
			response = await envoyer(endpoint, options, resultat);
		}
	}

	const data = await lireCorps(response);
	if (!response.ok) {
		throw toApiError(response.status, data);
	}
	return data as T;
}

/** Révoque le refresh côté backend (erreurs ignorées), puis vide la session locale. */
export async function logout(): Promise<void> {
	const refresh = getRefreshToken();
	try {
		if (refresh) {
			await apiRequest("/api/auth/logout/", {
				method: "POST",
				body: JSON.stringify({ refresh }),
			});
		}
	} catch {
		// La session locale est vidée quoi qu'il arrive.
	} finally {
		clearSession();
	}
}

export { API_URL };
