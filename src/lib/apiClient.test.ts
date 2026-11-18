import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, API_URL, apiRequest, logout } from "./apiClient";

type Reponse = { status: number; body?: unknown };

function memoire(initial: Record<string, string> = {}) {
	const store = new Map(Object.entries(initial));
	return {
		getItem: (k: string) => store.get(k) ?? null,
		setItem: (k: string, v: string) => void store.set(k, v),
		removeItem: (k: string) => void store.delete(k),
		clear: () => store.clear(),
		store,
	};
}

function reponse({ status, body }: Reponse): Response {
	const texte = body === undefined ? "" : JSON.stringify(body);
	return new Response(status === 204 ? null : texte, { status });
}

let storage: ReturnType<typeof memoire>;
let fetchMock: ReturnType<typeof vi.fn>;
let assign: ReturnType<typeof vi.fn>;

/** Routes simulées : `refresh` pour /api/auth/refresh/, `autres` dans l'ordre pour le reste. */
function installer(refresh: Reponse[], autres: Reponse[]) {
	fetchMock = vi.fn(async (url: string) => {
		const file = url.endsWith("/api/auth/refresh/") ? refresh : autres;
		const suivante = file.shift();
		if (!suivante) throw new Error(`appel inattendu : ${url}`);
		return reponse(suivante);
	});
	vi.stubGlobal("fetch", fetchMock);
}

function entetes(appel: number): Record<string, string> {
	return fetchMock.mock.calls[appel][1].headers as Record<string, string>;
}

function appelsRefresh(): number {
	return fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/api/auth/refresh/")).length;
}

beforeEach(() => {
	storage = memoire({ access_token: "A", refresh_token: "R" });
	assign = vi.fn();
	vi.stubGlobal("localStorage", storage);
	vi.stubGlobal("window", { localStorage: storage, location: { assign } });
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("apiRequest", () => {
	it("ajoute le jeton d'accès", async () => {
		installer([], [{ status: 200, body: [] }]);
		await apiRequest("/api/v1/lots/");
		expect(fetchMock.mock.calls[0][0]).toBe(`${API_URL}/api/v1/lots/`);
		expect(entetes(0).Authorization).toBe("Bearer A");
	});

	it("n'ajoute pas de jeton avec auth: false", async () => {
		installer([], [{ status: 200, body: {} }]);
		await apiRequest("/api/auth/login/", { method: "POST", auth: false });
		expect(entetes(0).Authorization).toBeUndefined();
	});

	it("rafraîchit le jeton sur 401 puis rejoue la requête", async () => {
		installer(
			[{ status: 200, body: { access: "A2", refresh: "R2" } }],
			[{ status: 401, body: { detail: "expiré" } }, { status: 200, body: [1] }],
		);
		await expect(apiRequest("/api/v1/lots/")).resolves.toEqual([1]);
		expect(entetes(2).Authorization).toBe("Bearer A2");
		expect(storage.store.get("access_token")).toBe("A2");
		expect(storage.store.get("refresh_token")).toBe("R2");
	});

	it("ne fait qu'un refresh pour plusieurs 401 simultanés", async () => {
		installer(
			[{ status: 200, body: { access: "A2", refresh: "R2" } }],
			[
				{ status: 401 },
				{ status: 401 },
				{ status: 401 },
				{ status: 200, body: 1 },
				{ status: 200, body: 2 },
				{ status: 200, body: 3 },
			],
		);
		const resultats = await Promise.all([
			apiRequest("/api/v1/a/"),
			apiRequest("/api/v1/b/"),
			apiRequest("/api/v1/c/"),
		]);
		expect(resultats.sort()).toEqual([1, 2, 3]);
		expect(appelsRefresh()).toBe(1);
	});

	it("vide la session et renvoie vers /login si le refresh échoue", async () => {
		installer([{ status: 401 }], [{ status: 401 }]);
		const erreur = (await apiRequest("/api/v1/lots/").catch((e: unknown) => e)) as ApiError;
		expect(erreur).toBeInstanceOf(ApiError);
		expect(erreur.status).toBe(401);
		expect(storage.store.has("access_token")).toBe(false);
		expect(storage.store.has("refresh_token")).toBe(false);
		expect(assign).toHaveBeenCalledWith("/login");
		expect(appelsRefresh()).toBe(1);
	});

	it("ne rafraîchit pas une seconde fois si le rejeu reçoit encore 401", async () => {
		installer(
			[{ status: 200, body: { access: "A2", refresh: "R2" } }],
			[{ status: 401 }, { status: 401 }],
		);
		await expect(apiRequest("/api/v1/lots/")).rejects.toMatchObject({ status: 401 });
		expect(appelsRefresh()).toBe(1);
	});

	it("renvoie null pour une réponse 204", async () => {
		installer([], [{ status: 204 }]);
		await expect(apiRequest("/api/v1/x/", { method: "POST" })).resolves.toBeNull();
	});

	it.each(["/api/auth/login/", "/api/auth/refresh/"])("ne rafraîchit jamais pour %s", async (route) => {
		installer([{ status: 401 }], [{ status: 401 }]);
		await expect(apiRequest(route, { method: "POST" })).rejects.toMatchObject({ status: 401 });
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});

describe("logout", () => {
	it("révoque le refresh puis vide la session, même si l'appel échoue", async () => {
		installer([], [{ status: 500 }]);
		await logout();
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ refresh: "R" });
		expect(storage.store.size).toBe(0);
	});
});
