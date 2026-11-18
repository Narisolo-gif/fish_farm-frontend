type Decimal = string | number | null | undefined;

/** Lit un décimal de l'API (souvent une chaîne, ex. "20.00") ; `null` si absent ou illisible. */
export function parseDecimal(value: Decimal): number | null {
	if (value === null || value === undefined || value === "") {
		return null;
	}
	const nombre = typeof value === "number" ? value : Number(value);
	return Number.isFinite(nombre) ? nombre : null;
}

/** Affiche un décimal au format français ; « — » si absent. */
export function formatDecimal(value: Decimal, digits = 2): string {
	const nombre = parseDecimal(value);
	if (nombre === null) {
		return "—";
	}
	return nombre.toLocaleString("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** Date du jour `AAAA-MM-JJ` dans le fuseau de la ferme (Indian/Antananarivo). */
export function todayIso(now: Date = new Date()): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: "Indian/Antananarivo",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(now);
}

/** Liste d'une réponse d'API, paginée ou non. */
export function listResults<T>(data: T[] | { results: T[] }): T[] {
	return Array.isArray(data) ? data : data.results;
}
