/**
 * Copie de `MATRICE` (fish_farm-backend, apps/core/permissions.py) au commit 54ffab2.
 * À resynchroniser si le backend change. Le backend reste l'autorité : cette
 * matrice sert seulement à masquer les actions non permises dans l'interface.
 * Noms de ressources et d'actions : ceux des viewsets DRF.
 */

export type Role = "Administrateur" | "Directeur" | "Gestionnaire" | "Employé";

const ADMINISTRATEUR: Role = "Administrateur";
const DIRECTEUR: Role = "Directeur";
const GESTIONNAIRE: Role = "Gestionnaire";
const EMPLOYE: Role = "Employé";

const ROLES: readonly Role[] = [ADMINISTRATEUR, DIRECTEUR, GESTIONNAIRE, EMPLOYE];

const TOUS = ROLES;
const PILOTAGE: readonly Role[] = [ADMINISTRATEUR, DIRECTEUR];
const TERRAIN: readonly Role[] = [ADMINISTRATEUR, DIRECTEUR, EMPLOYE];
const COMPTES: readonly Role[] = [ADMINISTRATEUR, GESTIONNAIRE];
const ADMIN_SEUL: readonly Role[] = [ADMINISTRATEUR];

type Regles = Readonly<Record<string, readonly Role[]>>;

const LECTURE: Regles = { list: TOUS, retrieve: TOUS };
const CRUD_PILOTAGE: Regles = {
	...LECTURE,
	create: PILOTAGE,
	update: PILOTAGE,
	partial_update: PILOTAGE,
	destroy: PILOTAGE,
};

export const MATRICE = {
	// Comptes
	roles: {
		...LECTURE,
		create: ADMIN_SEUL,
		update: ADMIN_SEUL,
		partial_update: ADMIN_SEUL,
		destroy: ADMIN_SEUL,
	},
	utilisateurs: {
		list: [ADMINISTRATEUR, DIRECTEUR, GESTIONNAIRE],
		retrieve: [ADMINISTRATEUR, DIRECTEUR, GESTIONNAIRE],
		create: COMPTES,
		update: COMPTES,
		partial_update: COMPTES,
		destroy: COMPTES,
		reset_password: COMPTES,
		change_password: TOUS,
	},
	// Référentiels
	bassins: CRUD_PILOTAGE,
	hapas: CRUD_PILOTAGE,
	types_provende: CRUD_PILOTAGE,
	provendes: CRUD_PILOTAGE,
	causes_mortalite: CRUD_PILOTAGE,
	categories_perte: CRUD_PILOTAGE,
	// Chaîne de démarrage
	reproductions: { ...CRUD_PILOTAGE, desactiver: PILOTAGE },
	pontes: { ...CRUD_PILOTAGE, desactiver: PILOTAGE },
	eclosions: {
		...CRUD_PILOTAGE,
		desactiver: PILOTAGE,
		getbyref_pontes: TOUS,
		getbydateEclosion: TOUS,
	},
	lots: CRUD_PILOTAGE,
	// Traitement et stock
	traitement: {
		...CRUD_PILOTAGE,
		effectifs: TOUS,
		apercu_cloture: TOUS,
		cloturer: PILOTAGE,
	},
	stocks: {
		...LECTURE,
		create: PILOTAGE,
		update: PILOTAGE,
		partial_update: PILOTAGE,
		// Outil de nettoyage des tests : Administrateur seul.
		destroy: ADMIN_SEUL,
	},
	// Journaux de terrain
	mouvements: { ...LECTURE, solde: TOUS, par_hapa: TOUS, annuler: PILOTAGE },
	evenements_mortalite_perte: {
		...LECTURE,
		totaux: TOUS,
		create: TERRAIN,
		annuler: PILOTAGE,
	},
	consommations_provende: {
		...LECTURE,
		totaux_journaliers: TOUS,
		jours_manquants_action: TOUS,
		create: TERRAIN,
		annuler: PILOTAGE,
	},
	environnement: {
		...LECTURE,
		historique_bassin: TOUS,
		derniere_mesure_bassin: TOUS,
		dernieres_mesures: TOUS,
		create: TERRAIN,
		update: PILOTAGE,
		partial_update: PILOTAGE,
		destroy: PILOTAGE,
	},
	sorties_stock: { ...LECTURE, annuler: PILOTAGE },
	// Grossissement
	lots_grossissement: {
		...LECTURE,
		suivi: TOUS,
		origine: TOUS,
		apercu_cloture: TOUS,
		historique_clotures: TOUS,
		apercu_sortie: PILOTAGE,
		create: PILOTAGE,
		partial_update: PILOTAGE,
		cloturer: PILOTAGE,
		evacuer: PILOTAGE,
	},
	pesees: {
		...LECTURE,
		create: TERRAIN,
		apercu: TERRAIN,
		partial_update: PILOTAGE,
		annuler: PILOTAGE,
	},
} satisfies Record<string, Regles>;

export type Ressource = keyof typeof MATRICE;

function estRole(role: string): role is Role {
	return (ROLES as readonly string[]).includes(role);
}

/** Vrai si `role` peut faire `action` sur `ressource` ; refus par défaut. */
export function can(role: string | null | undefined, ressource: Ressource, action: string): boolean {
	if (!role || !estRole(role)) {
		return false;
	}
	const regles: Regles = MATRICE[ressource];
	return regles[action]?.includes(role) ?? false;
}
