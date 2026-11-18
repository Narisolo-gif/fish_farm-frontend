import { describe, expect, it } from "vitest";
import { formatDecimal, listResults, parseDecimal, todayIso } from "./formatters";

describe("parseDecimal", () => {
	it("lit un décimal renvoyé en chaîne", () => {
		expect(parseDecimal("20.00")).toBe(20);
	});

	it.each(["", null, undefined, "abc"])("renvoie null pour %s", (valeur) => {
		expect(parseDecimal(valeur)).toBeNull();
	});

	it("garde un nombre", () => {
		expect(parseDecimal(3.5)).toBe(3.5);
	});
});

describe("formatDecimal", () => {
	it("formate en français avec le nombre de décimales demandé", () => {
		expect(formatDecimal("1234.5", 2).replace(/\s/g, " ")).toBe("1 234,50");
	});

	it("affiche un tiret pour une valeur absente", () => {
		expect(formatDecimal(null)).toBe("—");
	});
});

describe("todayIso", () => {
	it("donne la date du jour à Antananarivo (UTC+3)", () => {
		expect(todayIso(new Date("2026-11-17T22:30:00Z"))).toBe("2026-11-18");
	});
});

describe("listResults", () => {
	it("accepte un tableau ou une réponse paginée", () => {
		expect(listResults([1])).toEqual([1]);
		expect(listResults({ results: [2] })).toEqual([2]);
	});
});
