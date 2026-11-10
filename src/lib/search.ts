/**
 * Recherche « élastique » côté client :
 * - insensible à la casse et aux accents ;
 * - chaque mot saisi doit apparaître dans au moins une des valeurs (ordre libre) ;
 * - les séparateurs de milliers sont ignorés (« 1 200 » trouve « 1200 » et inversement).
 */
export function normalizeSearch(value: string) {
	return value
		.toLocaleLowerCase("fr")
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/(\d)[\s  ]+(?=\d{3}\b)/g, "$1")
		.trim();
}

export function matchesSearch(
	values: Array<string | number | null | undefined>,
	query: string,
) {
	const tokens = normalizeSearch(query).split(/\s+/).filter(Boolean);
	if (tokens.length === 0) {
		return true;
	}

	const haystack = values
		.filter((value) => value !== null && value !== undefined && value !== "")
		.map((value) => normalizeSearch(String(value)))
		.join(" | ");

	return tokens.every((token) => haystack.includes(token));
}
