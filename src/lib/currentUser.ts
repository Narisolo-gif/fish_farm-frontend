"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { apiRequest } from "./apiClient";
import { can, type Ressource } from "./permissions";
import { getAccessToken, getSessionVersion, onSessionCleared, subscribeSession } from "./session";

export type CurrentUser = {
	id: number;
	username: string;
	first_name: string;
	last_name: string;
	email: string;
	role: { id: number; libelle: string } | null;
	statut: string;
	must_change_password: boolean;
};

let enCache: Promise<CurrentUser> | null = null;

onSessionCleared(() => {
	enCache = null;
});

/** `GET /api/auth/me/`, un seul appel partagé tant que la session dure ; un échec n'est pas mis en cache. */
export function fetchCurrentUser(): Promise<CurrentUser> {
	if (!enCache) {
		const appel = apiRequest<CurrentUser>("/api/auth/me/");
		enCache = appel;
		appel.catch(() => {
			if (enCache === appel) {
				enCache = null;
			}
		});
	}
	return enCache;
}

/** Utilisateur courant ; rechargé à chaque connexion ou déconnexion (version de session). */
export function useCurrentUser(): { user: CurrentUser | null; loading: boolean } {
	const [user, setUser] = useState<CurrentUser | null>(null);
	const [loading, setLoading] = useState(true);
	const versionSession = useSyncExternalStore(subscribeSession, getSessionVersion, () => 0);

	useEffect(() => {
		let actif = true;
		const fin = (valeur: CurrentUser | null) => {
			if (actif) {
				setUser(valeur);
				setLoading(false);
			}
		};
		if (!getAccessToken()) {
			Promise.resolve(null).then(fin);
		} else {
			fetchCurrentUser().then(fin, () => fin(null));
		}
		return () => {
			actif = false;
		};
	}, [versionSession]);

	return { user, loading };
}

/** Vrai si l'utilisateur courant peut faire `action` sur `ressource` ; faux tant qu'il n'est pas chargé. */
export function useCan(ressource: Ressource, action: string): boolean {
	const { user } = useCurrentUser();
	return can(user?.role?.libelle, ressource, action);
}
