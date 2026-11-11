"use client";

import { type FormEvent, useState } from "react";
import { ApiError } from "@/lib/apiClient";
import { createSortie, updateSortie } from "@/app/features/production/stocks/services/sortieStockApi";
import type {
	BassinDestination,
	SortieStock,
	SortieStockPayload,
} from "@/app/features/production/stocks/types/sortieStock.types";

/** Création d'un brouillon de sortie, ou modification d'un brouillon existant. */
export function SortieStockForm({
	lotId,
	dateMiseEnStock,
	bassins,
	sortie,
	onSaved,
	onCancel,
}: {
	lotId: number;
	/** Date de mise en stock (ISO) : le lot n'est présent dans les hapas qu'à partir de cette date. */
	dateMiseEnStock: string;
	bassins: BassinDestination[];
	/** Brouillon à modifier ; création si absent. */
	sortie?: SortieStock | null;
	onSaved: (message: string) => void;
	onCancel: () => void;
}) {
	const [bassinId, setBassinId] = useState(() => {
		if (sortie) return String(sortie.id_bassin_destination);
		return bassins.length === 1 ? String(bassins[0].id) : "";
	});
	const [date, setDate] = useState(() => toLocalDateTimeValue(sortie ? new Date(sortie.date_sortie) : new Date()));
	const [observation, setObservation] = useState(sortie?.observation ?? "");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		setFieldErrors({});

		const dateValue = new Date(date);
		if (!bassinId) {
			setError("Sélectionnez un bassin de grossissement actif.");
			return;
		}
		if (Number.isNaN(dateValue.getTime()) || dateValue > new Date()) {
			setError("La date de sortie ne peut pas être future.");
			return;
		}
		// Le backend raisonne en jours (TIME_ZONE = UTC) pour la présence du lot dans ses hapas.
		if (dateValue.toISOString().slice(0, 10) < new Date(dateMiseEnStock).toISOString().slice(0, 10)) {
			setError("La date de sortie ne peut pas précéder la mise en stock du lot.");
			return;
		}

		const payload: SortieStockPayload = {
			id_bassin_destination: Number(bassinId),
			date_sortie: dateValue.toISOString(),
			observation: observation.trim(),
		};

		setIsSubmitting(true);
		try {
			if (sortie) {
				await updateSortie(sortie.id, payload);
				onSaved("Brouillon de sortie modifié.");
			} else {
				await createSortie({ ...payload, id_lot: lotId });
				onSaved("Brouillon de sortie créé. Il doit être validé pour transférer le lot en grossissement.");
			}
		} catch (submitError) {
			if (submitError instanceof ApiError) {
				setFieldErrors(submitError.fieldErrors);
			}
			setError(submitError instanceof Error ? submitError.message : "Impossible d'enregistrer la sortie.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form className="form-card wide treatment-record-form" onSubmit={handleSubmit}>
			<h3>{sortie ? "Modifier le brouillon de sortie" : "Nouvelle sortie"}</h3>
			<div className="form-grid">
				<label>
					Type de sortie
					<select value="GROSSISSEMENT" disabled={isSubmitting} onChange={() => undefined}>
						<option value="GROSSISSEMENT">Grossissement</option>
						<option value="VENTE" disabled>Vente (à venir)</option>
					</select>
				</label>
				<label>
					Bassin de grossissement
					<select
						value={bassinId}
						onChange={(event) => setBassinId(event.target.value)}
						required
						disabled={isSubmitting || bassins.length === 0}
					>
						<option value="" disabled>
							{bassins.length === 0 ? "Aucun bassin de grossissement actif" : "Sélectionner un bassin"}
						</option>
						{bassins.map((bassin) => (
							<option key={bassin.id} value={bassin.id}>{bassin.reference}</option>
						))}
					</select>
					<FieldError messages={fieldErrors.id_bassin_destination} />
				</label>
				<label>
					Date et heure de sortie
					<input
						type="datetime-local"
						value={date}
						max={toLocalDateTimeValue(new Date())}
						onChange={(event) => setDate(event.target.value)}
						required
						disabled={isSubmitting}
					/>
					<FieldError messages={fieldErrors.date_sortie} />
				</label>
			</div>
			<label>
				Observation (facultatif)
				<textarea value={observation} onChange={(event) => setObservation(event.target.value)} disabled={isSubmitting} />
				<FieldError messages={fieldErrors.observation} />
			</label>
			<p className="helper-text">
				L&apos;effectif sortant est calculé par le backend à partir des hapas du lot à la date de sortie ; il sera
				affiché à la validation.
			</p>
			<FieldError messages={fieldErrors.id_lot} />
			{error && <p className="form-error" role="alert">{error}</p>}
			<div className="form-actions">
				<button className="button button-ghost" type="button" onClick={onCancel} disabled={isSubmitting}>
					Annuler
				</button>
				<button className="button button-primary" type="submit" disabled={isSubmitting || bassins.length === 0}>
					{isSubmitting ? "Enregistrement..." : sortie ? "Enregistrer les modifications" : "Créer le brouillon"}
				</button>
			</div>
		</form>
	);
}

function FieldError({ messages }: { messages?: string[] }) {
	if (!messages || messages.length === 0) return null;
	return <small className="form-error">{messages.join(" ")}</small>;
}

function toLocalDateTimeValue(date: Date) {
	const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
	return local.toISOString().slice(0, 16);
}
