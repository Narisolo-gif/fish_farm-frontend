import { describe, expect, it } from "vitest";
import { can } from "./permissions";

describe("can", () => {
	it.each([
		["Directeur", "traitement", "cloturer", true],
		["Gestionnaire", "traitement", "cloturer", false],
		["Employé", "traitement", "apercu_cloture", true],
		["Employé", "evenements_mortalite_perte", "create", true],
		["Gestionnaire", "evenements_mortalite_perte", "create", false],
		["Employé", "evenements_mortalite_perte", "annuler", false],
		["Gestionnaire", "utilisateurs", "create", true],
		["Directeur", "utilisateurs", "create", false],
		["Employé", "utilisateurs", "list", false],
		["Directeur", "stocks", "destroy", false],
		["Administrateur", "stocks", "destroy", true],
		["Gestionnaire", "environnement", "create", false],
		["Directeur", "environnement", "destroy", true],
		["Employé", "pesees", "apercu", true],
		["Employé", "pesees", "partial_update", false],
		["Directeur", "lots_grossissement", "evacuer", true],
		["Gestionnaire", "roles", "list", true],
		["Directeur", "roles", "create", false],
	] as const)("%s / %s.%s → %s", (role, ressource, action, attendu) => {
		expect(can(role, ressource, action)).toBe(attendu);
	});

	it("refuse une action absente de la matrice", () => {
		expect(can("Administrateur", "lots", "cloturer")).toBe(false);
	});

	it.each([null, undefined, "", "Stagiaire"])("refuse le rôle %s partout", (role) => {
		expect(can(role, "bassins", "list")).toBe(false);
	});
});
