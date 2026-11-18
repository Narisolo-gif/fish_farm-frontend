/** Jetons de session : seul module qui lit ou écrit `access_token` et `refresh_token`. */

const CLE_ACCES = "access_token";
const CLE_REFRESH = "refresh_token";

function stockage(): Storage | null {
	return typeof window === "undefined" ? null : window.localStorage;
}

export function getAccessToken(): string | null {
	return stockage()?.getItem(CLE_ACCES) ?? null;
}

export function getRefreshToken(): string | null {
	return stockage()?.getItem(CLE_REFRESH) ?? null;
}

export function setTokens(access: string, refresh: string): void {
	const s = stockage();
	s?.setItem(CLE_ACCES, access);
	s?.setItem(CLE_REFRESH, refresh);
}

const abonnes = new Set<() => void>();

/** Appelé à chaque `clearSession()` (ex. pour vider le cache de l'utilisateur courant). */
export function onSessionCleared(callback: () => void): void {
	abonnes.add(callback);
}

export function clearSession(): void {
	const s = stockage();
	s?.removeItem(CLE_ACCES);
	s?.removeItem(CLE_REFRESH);
	abonnes.forEach((callback) => callback());
}
