import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchCurrentUser } from "./currentUser";
import { clearSession } from "./session";

const utilisateur = { id: 1, username: "dir", role: { id: 2, libelle: "Directeur" } };

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	const store = new Map([["access_token", "A"]]);
	const storage = {
		getItem: (k: string) => store.get(k) ?? null,
		setItem: (k: string, v: string) => void store.set(k, v),
		removeItem: (k: string) => void store.delete(k),
	};
	vi.stubGlobal("localStorage", storage);
	vi.stubGlobal("window", { localStorage: storage, location: { assign: vi.fn() } });
	fetchMock = vi.fn(async () => new Response(JSON.stringify(utilisateur), { status: 200 }));
	vi.stubGlobal("fetch", fetchMock);
	clearSession();
	storage.setItem("access_token", "A");
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("fetchCurrentUser", () => {
	it("partage un seul appel à /api/auth/me/", async () => {
		const [a, b] = await Promise.all([fetchCurrentUser(), fetchCurrentUser()]);
		await fetchCurrentUser();
		expect(a).toEqual(utilisateur);
		expect(b).toBe(a);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/auth\/me\/$/);
	});

	it("relance l'appel après clearSession", async () => {
		await fetchCurrentUser();
		clearSession();
		await fetchCurrentUser();
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("n'est pas mis en cache en cas d'échec", async () => {
		fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ detail: "x" }), { status: 403 }));
		await expect(fetchCurrentUser()).rejects.toMatchObject({ status: 403 });
		await expect(fetchCurrentUser()).resolves.toEqual(utilisateur);
	});
});
