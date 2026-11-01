const API_URL =
	process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getErrorMessage(data: unknown): string {
	if (typeof data !== "object" || data === null) {
		return "Une erreur est survenue.";
	}

	if ("detail" in data && typeof data.detail === "string") {
		return data.detail;
	}

	const messages = Object.entries(data).flatMap(([field, value]) => {
		const values = Array.isArray(value) ? value : [value];
		return values
			.filter((item): item is string => typeof item === "string")
			.map((message) => field === "non_field_errors" ? message : `${field}: ${message}`);
	});

	return messages.length > 0 ? messages.join(" ") : "Une erreur est survenue.";
}

export async function apiRequest<T>(
	endpoint: string,
	options: RequestInit = {},
): Promise<T> {
	const response = await fetch(`${API_URL}${endpoint}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...(options.headers || {}),
		},
	});

	const data = await response.json().catch(() => null);

	if (!response.ok) {
		throw new Error(getErrorMessage(data));
	}

	return data;
}

export { API_URL };