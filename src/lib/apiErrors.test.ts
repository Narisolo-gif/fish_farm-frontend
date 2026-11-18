import { describe, expect, it } from "vitest";
import { ApiError, MESSAGE_403, MESSAGE_GENERIQUE, toApiError } from "./apiErrors";

describe("toApiError", () => {
	it("range un message de champ (chaîne) dans une liste", () => {
		const erreur = toApiError(400, { date_cloture: "La date ne peut pas être future." });
		expect(erreur).toBeInstanceOf(ApiError);
		expect(erreur.status).toBe(400);
		expect(erreur.fieldErrors).toEqual({ date_cloture: ["La date ne peut pas être future."] });
		expect(erreur.message).toContain("date_cloture: La date ne peut pas être future.");
	});

	it("garde une liste de messages de champ", () => {
		expect(toApiError(400, { quantite: ["a", "b"] }).fieldErrors.quantite).toEqual(["a", "b"]);
	});

	it("met detail dans generalMessage", () => {
		const erreur = toApiError(400, { detail: "Lot clôturé." });
		expect(erreur.generalMessage).toBe("Lot clôturé.");
		expect(erreur.fieldErrors).toEqual({});
	});

	it("joint non_field_errors dans generalMessage", () => {
		expect(toApiError(400, { non_field_errors: ["x", "y"] }).generalMessage).toBe("x y");
	});

	it("garde le corps brut et ignore les valeurs non textuelles", () => {
		const corps = { echantillon_non_conforme: "msg", lignes_non_conformes: [{ id: 1 }] };
		const erreur = toApiError(400, corps);
		expect(erreur.fieldErrors).toEqual({ echantillon_non_conforme: ["msg"] });
		expect(erreur.data).toBe(corps);
	});

	it("donne un message lisible pour un 403 sans corps", () => {
		const erreur = toApiError(403, null);
		expect(erreur.message).toBe(MESSAGE_403);
		expect(erreur.generalMessage).toBe(MESSAGE_403);
	});

	it("garde le detail d'un 403 quand il existe", () => {
		expect(toApiError(403, { detail: "Compte inactif." }).message).toBe("Compte inactif.");
	});

	it("donne le message générique pour un 500 sans corps", () => {
		expect(toApiError(500, null).message).toBe(MESSAGE_GENERIQUE);
	});
});
