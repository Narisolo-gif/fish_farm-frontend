"use client";

import { type FormEvent, useState } from "react";
import { ApiError } from "@/lib/apiClient";
import type { JournalHapa } from "@/app/features/production/shared/mortalite-ui/types/mortalite.types";
import {
	CorrectionPartielleError,
	corrigerConsommation,
	createConsommation,
} from "@/app/features/production/shared/provende-ui/services/provendeApi";
import {
	toBackendDay,
	toKg,
	type ConsommationProvende,
	type ConsommationProvendePayload,
	type Provende,
	type ProvendeHapaMode,
} from "@/app/features/production/shared/provende-ui/types/provende.types";

const QUANTITE_MAX_KG = 999_999.99;

export function ConsommationProvendeForm({
	bassinId,
	hapaMode,
	hapas,
	provendes,
	correction,
	onSaved,
	onCancel,
}: {
	bassinId: number;
	hapaMode: ProvendeHapaMode;
	hapas: JournalHapa[];
	/** Provendes proposées (déjà filtrées par type selon le module). */
	provendes: Provende[];
	/** Distribution à corriger : elle sera annulée puis ressaisie. */
	correction?: ConsommationProvende | null;
	onSaved: (message: string) => void;
	onCancel: () => void;
}) {
	const [mode, setMode] = useState<"create" | "correct">(correction ? "correct" : "create");
	const [hapaId, setHapaId] = useState(() => {
		if (correction?.id_hapa) return String(correction.id_hapa);
		return hapaMode === "required" && hapas.length === 1 ? String(hapas[0].id) : "";
	});
	const [provendeId, setProvendeId] = useState(() => {
		if (correction) return String(correction.id_provende);
		return provendes.length === 1 ? String(provendes[0].id) : "";
	});
	const [quantite, setQuantite] = useState(correction ? String(toKg(correction.quantite_kg)) : "");
	const [date, setDate] = useState(() =>
		toLocalDateTimeValue(correction ? new Date(correction.date_distribution) : new Date()),
	);
	const [observation, setObservation] = useState(correction?.observation ?? "");
	const [motif, setMotif] = useState("");

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

	const selectedHapa = hapaId ? Number(hapaId) : null;
	const selectedProvende = provendes.find((provende) => String(provende.id) === provendeId) ?? null;

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		setFieldErrors({});

		const quantiteValue = Number(quantite);
		const dateValue = new Date(date);
		if (quantite.trim() === "" || !Number.isFinite(quantiteValue) || quantiteValue < 0) {
			setError("La quantité ne peut pas être négative.");
			return;
		}
		if (quantiteValue > QUANTITE_MAX_KG || !/^\d+(\.\d{1,2})?$/.test(quantite.trim())) {
			setError("La quantité doit avoir au plus 2 décimales et ne pas dépasser 999 999,99 kg.");
			return;
		}
		if (Number.isNaN(dateValue.getTime()) || dateValue > new Date()) {
			setError("La date et l'heure ne peuvent pas être dans le futur.");
			return;
		}
		if (hapaMode === "required" && !selectedHapa) {
			setError("Un hapa est obligatoire pour ce bassin.");
			return;
		}
		if (!selectedProvende) {
			setError("Sélectionnez une provende.");
			return;
		}
		if (toBackendDay(dateValue) < selectedProvende.date_creation) {
			setError("La distribution ne peut pas précéder la date de création de la provende.");
			return;
		}
		if (mode === "correct" && !motif.trim()) {
			setError("Le motif de correction est obligatoire.");
			return;
		}

		const payload: ConsommationProvendePayload = {
			id_bassin: bassinId,
			id_hapa: selectedHapa,
			id_provende: selectedProvende.id,
			date_distribution: dateValue.toISOString(),
			quantite_kg: quantiteValue.toFixed(2),
			observation: observation.trim(),
		};

		setIsSubmitting(true);
		try {
			if (mode === "correct" && correction) {
				await corrigerConsommation(correction.id, motif.trim(), payload);
				onSaved("Distribution corrigée : l'ancienne saisie est annulée et la nouvelle est enregistrée.");
			} else {
				await createConsommation(payload);
				onSaved("Distribution de provende enregistrée.");
			}
		} catch (submitError) {
			const apiError = submitError instanceof CorrectionPartielleError ? submitError.cause : submitError;
			if (submitError instanceof CorrectionPartielleError) {
				// L'annulation est faite : la suite est une simple création.
				setMode("create");
			}
			if (apiError instanceof ApiError) {
				setFieldErrors(apiError.fieldErrors);
			}
			setError(submitError instanceof Error ? submitError.message : "Impossible d'enregistrer la distribution.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form className="form-card wide treatment-record-form" onSubmit={handleSubmit}>
			<h3>{mode === "correct" ? "Corriger la distribution" : "Ajouter une consommation de provende"}</h3>
			{mode === "correct" && (
				<p className="helper-text">
					Une distribution enregistrée n&apos;est pas modifiable : elle sera annulée avec le motif ci-dessous, puis
					la version corrigée sera enregistrée.
				</p>
			)}
			<div className="form-grid">
				{hapas.length > 0 && (
					<label>
						Hapa{hapaMode === "optional" && " (facultatif)"}
						<select
							value={hapaId}
							onChange={(event) => setHapaId(event.target.value)}
							required={hapaMode === "required"}
							disabled={isSubmitting}
						>
							<option value="" disabled={hapaMode === "required"}>
								{hapaMode === "required" ? "Sélectionner un hapa" : "Bassin entier"}
							</option>
							{hapas.map((hapa) => (
								<option key={hapa.id} value={hapa.id}>{hapa.nom}</option>
							))}
						</select>
						<FieldError messages={fieldErrors.id_hapa} />
					</label>
				)}
				<label>
					Provende
					<select
						value={provendeId}
						onChange={(event) => setProvendeId(event.target.value)}
						required
						disabled={isSubmitting || provendes.length === 0}
					>
						<option value="" disabled>
							{provendes.length === 0 ? "Aucune provende disponible" : "Sélectionner une provende"}
						</option>
						{provendes.map((provende) => (
							<option key={provende.id} value={provende.id}>
								{provende.type_provende_libelle} — {provende.reference}
							</option>
						))}
					</select>
					{selectedProvende && (
						<small className="helper-text">
							Créée le {new Date(`${selectedProvende.date_creation}T00:00:00`).toLocaleDateString("fr-FR")}
						</small>
					)}
					<FieldError messages={fieldErrors.id_provende} />
				</label>
				<label>
					Quantité (kg)
					<input
						type="number"
						min="0"
						max={QUANTITE_MAX_KG}
						step="0.01"
						value={quantite}
						onChange={(event) => setQuantite(event.target.value)}
						required
						disabled={isSubmitting}
					/>
					<FieldError messages={fieldErrors.quantite_kg} />
				</label>
				<label>
					Date et heure
					<input
						type="datetime-local"
						value={date}
						max={toLocalDateTimeValue(new Date())}
						onChange={(event) => setDate(event.target.value)}
						required
						disabled={isSubmitting}
					/>
					<FieldError messages={fieldErrors.date_distribution} />
				</label>
			</div>
			<label>
				Observation (facultatif)
				<textarea value={observation} onChange={(event) => setObservation(event.target.value)} disabled={isSubmitting} />
				<FieldError messages={fieldErrors.observation} />
			</label>
			{mode === "correct" && (
				<label>
					Motif de la correction
					<input
						type="text"
						value={motif}
						onChange={(event) => setMotif(event.target.value)}
						required
						disabled={isSubmitting}
						placeholder="Ex. : erreur de saisie sur la quantité"
					/>
					<FieldError messages={fieldErrors.motif} />
				</label>
			)}
			<p className="helper-text">Maximum 3 distributions par jour et par {hapas.length > 0 ? "hapa" : "bassin"}.</p>
			{error && <p className="form-error" role="alert">{error}</p>}
			<div className="form-actions">
				<button className="button button-ghost" type="button" onClick={onCancel} disabled={isSubmitting}>
					Annuler
				</button>
				<button className="button button-primary" type="submit" disabled={isSubmitting}>
					{isSubmitting ? "Enregistrement..." : mode === "correct" ? "Enregistrer la correction" : "Enregistrer"}
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
