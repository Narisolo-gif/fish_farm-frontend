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

export type ApiFieldErrors = Record<string, string[]>;

export class ApiError extends Error {
	status: number;
	fieldErrors: ApiFieldErrors;
	/** Message non rattaché à un champ (`detail` ou `non_field_errors`), vide sinon. */
	generalMessage: string;

	constructor(message: string, status: number, fieldErrors: ApiFieldErrors = {}, generalMessage = "") {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.fieldErrors = fieldErrors;
		this.generalMessage = generalMessage;
	}
}

function extractFieldErrors(data: unknown): ApiFieldErrors {
	if (typeof data !== "object" || data === null || Array.isArray(data)) {
		return {};
	}

	const fieldErrors: ApiFieldErrors = {};
	for (const [field, value] of Object.entries(data)) {
		if (field === "detail" || field === "non_field_errors") {
			continue;
		}
		const messages = (Array.isArray(value) ? value : [value]).filter(
			(item): item is string => typeof item === "string",
		);
		if (messages.length > 0) {
			fieldErrors[field] = messages;
		}
	}
	return fieldErrors;
}

function getGeneralErrorMessage(data: unknown): string {
	if (typeof data !== "object" || data === null) {
		return "";
	}
	if ("detail" in data && typeof data.detail === "string") {
		return data.detail;
	}
	if ("non_field_errors" in data && Array.isArray(data.non_field_errors)) {
		return data.non_field_errors.filter((item): item is string => typeof item === "string").join(" ");
	}
	return "";
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
		throw new ApiError(
			getErrorMessage(data),
			response.status,
			extractFieldErrors(data),
			getGeneralErrorMessage(data),
		);
	}

	return data;
}

export { API_URL };