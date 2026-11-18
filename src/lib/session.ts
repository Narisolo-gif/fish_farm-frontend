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

const abonnesFin = new Set<() => void>();
const abonnesVersion = new Set<() => void>();

/**
 * Version de la session : change à chaque connexion et déconnexion, pas lors d'un refresh.
 * Les composants s'y abonnent pour recharger l'utilisateur courant.
 */
let version = 0;

function nouvelleVersion(): void {
	version += 1;
	abonnesVersion.forEach((callback) => callback());
}

export function getSessionVersion(): number {
	return version;
}

export function subscribeSession(callback: () => void): () => void {
	abonnesVersion.add(callback);
	return () => abonnesVersion.delete(callback);
}

/** Enregistre les jetons ; une connexion (aucun jeton auparavant) ouvre une nouvelle version de session. */
export function setTokens(access: string, refresh: string): void {
	const s = stockage();
	const connexion = !s?.getItem(CLE_ACCES);
	s?.setItem(CLE_ACCES, access);
	s?.setItem(CLE_REFRESH, refresh);
	if (connexion) {
		nouvelleVersion();
	}
}

/** Appelé à chaque `clearSession()` (ex. pour vider le cache de l'utilisateur courant). */
export function onSessionCleared(callback: () => void): void {
	abonnesFin.add(callback);
}

export function clearSession(): void {
	const s = stockage();
	s?.removeItem(CLE_ACCES);
	s?.removeItem(CLE_REFRESH);
	abonnesFin.forEach((callback) => callback());
	nouvelleVersion();
}
