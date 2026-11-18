export const MESSAGE_GENERIQUE = "Une erreur est survenue.";
export const MESSAGE_403 = "Vous n'avez pas les droits nécessaires pour cette action.";

export type ApiFieldErrors = Record<string, string[]>;

export class ApiError extends Error {
	status: number;
	fieldErrors: ApiFieldErrors;
	/** Message non rattaché à un champ (`detail` ou `non_field_errors`), vide sinon. */
	generalMessage: string;
	/** Corps brut de la réponse (ex. `lignes_non_conformes` d'une pesée). */
	data: unknown;

	constructor(
		message: string,
		status: number,
		fieldErrors: ApiFieldErrors = {},
		generalMessage = "",
		data: unknown = null,
	) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.fieldErrors = fieldErrors;
		this.generalMessage = generalMessage;
		this.data = data;
	}
}

function textes(value: unknown): string[] {
	return (Array.isArray(value) ? value : [value]).filter(
		(item): item is string => typeof item === "string",
	);
}

function estObjet(data: unknown): data is Record<string, unknown> {
	return typeof data === "object" && data !== null && !Array.isArray(data);
}

function extractFieldErrors(data: unknown): ApiFieldErrors {
	if (!estObjet(data)) {
		return {};
	}
	const fieldErrors: ApiFieldErrors = {};
	for (const [field, value] of Object.entries(data)) {
		if (field === "detail" || field === "non_field_errors") {
			continue;
		}
		const messages = textes(value);
		if (messages.length > 0) {
			fieldErrors[field] = messages;
		}
	}
	return fieldErrors;
}

function getGeneralErrorMessage(data: unknown): string {
	if (!estObjet(data)) {
		return "";
	}
	if (typeof data.detail === "string") {
		return data.detail;
	}
	return textes(data.non_field_errors ?? []).join(" ");
}

function getErrorMessage(data: unknown): string {
	if (!estObjet(data)) {
		return "";
	}
	if (typeof data.detail === "string") {
		return data.detail;
	}
	return Object.entries(data)
		.flatMap(([field, value]) =>
			textes(value).map((message) => (field === "non_field_errors" ? message : `${field}: ${message}`)),
		)
		.join(" ");
}

/** Construit l'`ApiError` d'une réponse en échec, à partir de son statut et de son corps JSON (ou `null`). */
export function toApiError(status: number, data: unknown): ApiError {
	const repli = status === 403 ? MESSAGE_403 : MESSAGE_GENERIQUE;
	const general = getGeneralErrorMessage(data) || (status === 403 ? MESSAGE_403 : "");
	return new ApiError(getErrorMessage(data) || repli, status, extractFieldErrors(data), general, data);
}
