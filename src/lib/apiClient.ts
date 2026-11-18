import { toApiError } from "./apiErrors";

export { ApiError, type ApiFieldErrors } from "./apiErrors";

const API_URL =
	process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
		throw toApiError(response.status, data);
	}

	return data;
}

export { API_URL };
