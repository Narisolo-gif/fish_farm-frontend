import { useSyncExternalStore } from "react";

export const productionStorageKeys = {
	reproductionPontes: "fish-farm:reproduction-pontes",
	eclosions: "fish-farm:eclosions",
} as const;

type LocalRecordsSnapshot<T> = {
	records: T[];
	error: string;
	isReady: boolean;
};

const snapshots = new Map<string, { signature: string; value: LocalRecordsSnapshot<unknown> }>();
const listeners = new Map<string, Set<() => void>>();
const serverSnapshot: LocalRecordsSnapshot<never> = {
	records: [],
	error: "",
	isReady: false,
};

export function useLocalRecords<T>(
	key: string,
	isRecord: (value: unknown) => value is T,
): LocalRecordsSnapshot<T> {
	return useSyncExternalStore(
		(onStoreChange) => subscribeToLocalRecords(key, onStoreChange),
		() => getLocalRecordsSnapshot(key, isRecord),
		() => serverSnapshot,
	);
}

function getLocalRecordsSnapshot<T>(
	key: string,
	isRecord: (value: unknown) => value is T,
): LocalRecordsSnapshot<T> {
	let serialized: string | null;
	try {
		serialized = window.localStorage.getItem(key);
	} catch {
		return cacheSnapshot(key, "storage-error", {
			records: [],
			error: "Impossible d'accéder aux données enregistrées dans ce navigateur.",
			isReady: true,
		});
	}

	if (serialized === null) {
		return cacheSnapshot(key, "empty", { records: [], error: "", isReady: true });
	}

	const signature = `data:${serialized}`;
	const cachedSnapshot = snapshots.get(key);
	if (cachedSnapshot?.signature === signature) {
		return cachedSnapshot.value as LocalRecordsSnapshot<T>;
	}

	let records: unknown;
	try {
		records = JSON.parse(serialized);
	} catch {
		return cacheSnapshot(key, signature, {
			records: [],
			error: "Les données enregistrées dans ce navigateur sont illisibles.",
			isReady: true,
		});
	}

	if (!Array.isArray(records) || !records.every(isRecord)) {
		return cacheSnapshot(key, signature, {
			records: [],
			error: "Les données enregistrées dans ce navigateur ont un format inattendu.",
			isReady: true,
		});
	}

	return cacheSnapshot(key, signature, { records, error: "", isReady: true });
}

function cacheSnapshot<T>(
	key: string,
	signature: string,
	value: LocalRecordsSnapshot<T>,
): LocalRecordsSnapshot<T> {
	const cachedSnapshot = snapshots.get(key);
	if (cachedSnapshot?.signature === signature) {
		return cachedSnapshot.value as LocalRecordsSnapshot<T>;
	}

	snapshots.set(key, { signature, value });
	return value;
}

function subscribeToLocalRecords(key: string, onStoreChange: () => void) {
	const keyListeners = listeners.get(key) ?? new Set<() => void>();
	keyListeners.add(onStoreChange);
	listeners.set(key, keyListeners);

	function handleStorage(event: StorageEvent) {
		if (event.key === key || event.key === null) {
			snapshots.delete(key);
			onStoreChange();
		}
	}

	window.addEventListener("storage", handleStorage);

	return () => {
		keyListeners.delete(onStoreChange);
		window.removeEventListener("storage", handleStorage);
		if (keyListeners.size === 0) {
			listeners.delete(key);
		}
	};
}

export function writeLocalRecords<T>(key: string, records: T[]) {
	if (typeof window === "undefined") {
		throw new Error("Le stockage local est accessible uniquement depuis le navigateur.");
	}

	try {
		window.localStorage.setItem(key, JSON.stringify(records));
	} catch {
		throw new Error("Impossible d'enregistrer les données dans ce navigateur.");
	}

	snapshots.delete(key);
	listeners.get(key)?.forEach((listener) => listener());
}
