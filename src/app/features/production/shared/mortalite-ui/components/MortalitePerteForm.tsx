"use client";

import { type FormEvent, useState } from "react";
import { ApiError } from "@/lib/apiClient";
import {
	CorrectionPartielleError,
	corrigerEvenement,
	createEvenement,
} from "@/app/features/production/shared/mortalite-ui/services/mortaliteApi";
import {
	TYPE_EVENEMENT_LABELS,
	especeLabel,
	type EvenementMortalitePerte,
	type EvenementPayload,
	type HapaMode,
	type JournalHapa,
	type Referentiel,
	type TypeEvenement,
} from "@/app/features/production/shared/mortalite-ui/types/mortalite.types";

export function MortalitePerteForm({
	bassinId,
	hapaMode,
	hapas,
	especes,
	effectifDisponible,
	causes,
	categories,
	correction,
	onSaved,
	onCancel,
}: {
	bassinId: number;
	hapaMode: HapaMode;
	hapas: JournalHapa[];
	/** Espèces présentes dans le périmètre ; vide si l'effectif est inconnu. */
	especes: string[];
	/** Effectif vivant pour un hapa (ou le bassin quand `hapaId` est nul) et une espèce. */
	effectifDisponible: (hapaId: number | null, espece: string | null) => number;
	causes: Referentiel[];
	categories: Referentiel[];
	/** Événement à corriger : il sera annulé puis ressaisi. */
	correction?: EvenementMortalitePerte | null;
	onSaved: (message: string) => void;
	onCancel: () => void;
}) {
	const [mode, setMode] = useState<"create" | "correct">(correction ? "correct" : "create");
	const [type, setType] = useState<TypeEvenement>(
		(correction?.type_evenement as TypeEvenement | undefined) ?? "MORTALITE",
	);
	const [hapaId, setHapaId] = useState(() => {
		if (correction?.id_hapa) return String(correction.id_hapa);
		return hapaMode === "required" && hapas.length === 1 ? String(hapas[0].id) : "";
	});
	const [espece, setEspece] = useState(correction?.espece ?? (especes.length === 1 ? especes[0] : ""));
	const [quantite, setQuantite] = useState(correction ? String(correction.quantite) : "");
	const [date, setDate] = useState(() =>
		toLocalDateTimeValue(correction ? new Date(correction.date_evenement) : new Date()),
	);
	const [causeId, setCauseId] = useState(correction?.id_cause ? String(correction.id_cause) : "");
	const [categorieId, setCategorieId] = useState(correction?.id_categorie ? String(correction.id_categorie) : "");
	const [justification, setJustification] = useState(correction?.justification ?? "");
	const [observation, setObservation] = useState(correction?.observation ?? "");
	const [motif, setMotif] = useState("");

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

	const selectedHapa = hapaId ? Number(hapaId) : null;
	const disponible = effectifDisponible(selectedHapa, espece || null);
	const referentiel = type === "MORTALITE" ? causes : categories;

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		setFieldErrors({});

		const quantiteValue = Number(quantite);
		const dateValue = new Date(date);
		if (!Number.isInteger(quantiteValue) || quantiteValue < 1) {
			setError("La quantité doit être un entier supérieur ou égal à 1.");
			return;
		}
		if (Number.isNaN(dateValue.getTime()) || dateValue > new Date()) {
			setError("La date de l'événement ne peut pas être dans le futur.");
			return;
		}
		if (hapaMode === "required" && !selectedHapa) {
			setError("Un hapa est obligatoire pour ce bassin.");
			return;
		}
		if (type === "PERTE" && !justification.trim()) {
			setError("La justification est obligatoire pour une perte.");
			return;
		}
		if (mode === "correct" && !motif.trim()) {
			setError("Le motif de correction est obligatoire.");
			return;
		}

		const payload: EvenementPayload = {
			type_evenement: type,
			id_bassin: bassinId,
			id_hapa: hapaMode === "forbidden" ? null : selectedHapa,
			quantite: quantiteValue,
			date_evenement: dateValue.toISOString(),
			id_cause: type === "MORTALITE" && causeId ? Number(causeId) : null,
			id_categorie: type === "PERTE" && categorieId ? Number(categorieId) : null,
			justification: justification.trim(),
			observation: observation.trim(),
			...(espece ? { espece } : {}),
		};

		setIsSubmitting(true);
		try {
			if (mode === "correct" && correction) {
				await corrigerEvenement(correction.id, motif.trim(), payload);
				onSaved("Événement corrigé : l'ancienne saisie est annulée et la nouvelle est enregistrée.");
			} else {
				await createEvenement(payload);
				onSaved(`${TYPE_EVENEMENT_LABELS[type]} enregistrée.`);
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
			setError(submitError instanceof Error ? submitError.message : "Impossible d'enregistrer l'événement.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form className="form-card wide treatment-record-form" onSubmit={handleSubmit}>
			<h3>{mode === "correct" ? "Corriger l'événement" : "Ajouter une mortalité ou une perte"}</h3>
			{mode === "correct" && (
				<p className="helper-text">
					Un événement enregistré n&apos;est pas modifiable : il sera annulé avec le motif ci-dessous, puis la
					version corrigée sera enregistrée.
				</p>
			)}
			<div className="form-grid">
				<label>
					Type
					<select
						value={type}
						onChange={(event) => setType(event.target.value as TypeEvenement)}
						disabled={isSubmitting}
					>
						<option value="MORTALITE">Mortalité</option>
						<option value="PERTE">Perte</option>
					</select>
				</label>
				{hapaMode !== "forbidden" && hapas.length > 0 && (
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
				{especes.length > 1 && (
					<label>
						Espèce
						<select value={espece} onChange={(event) => setEspece(event.target.value)} required disabled={isSubmitting}>
							<option value="" disabled>Sélectionner l&apos;espèce</option>
							{especes.map((item) => (
								<option key={item} value={item}>{especeLabel(item)}</option>
							))}
						</select>
						<FieldError messages={fieldErrors.espece} />
					</label>
				)}
				<label>
					Quantité
					<input
						type="number"
						min="1"
						step="1"
						value={quantite}
						onChange={(event) => setQuantite(event.target.value)}
						required
						disabled={isSubmitting}
					/>
					<small className="helper-text">
						Effectif vivant {selectedHapa ? "du hapa" : "du bassin"} : {disponible.toLocaleString("fr-FR")}
					</small>
					<FieldError messages={fieldErrors.quantite} />
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
					<FieldError messages={fieldErrors.date_evenement} />
				</label>
				<label>
					{type === "MORTALITE" ? "Cause de mortalité" : "Catégorie de perte"}
					<select
						value={type === "MORTALITE" ? causeId : categorieId}
						onChange={(event) =>
							type === "MORTALITE" ? setCauseId(event.target.value) : setCategorieId(event.target.value)
						}
						required
						disabled={isSubmitting || referentiel.length === 0}
					>
						<option value="" disabled>
							{referentiel.length === 0 ? "Aucune valeur active configurée" : "Sélectionner"}
						</option>
						{referentiel.map((item) => (
							<option key={item.id} value={item.id}>{item.libelle}</option>
						))}
					</select>
					<FieldError messages={type === "MORTALITE" ? fieldErrors.id_cause : fieldErrors.id_categorie} />
				</label>
			</div>
			<label>
				Justification{type === "PERTE" ? "" : " (facultatif)"}
				<textarea
					value={justification}
					onChange={(event) => setJustification(event.target.value)}
					required={type === "PERTE"}
					disabled={isSubmitting}
				/>
				<FieldError messages={fieldErrors.justification} />
			</label>
			<label>
				Observation (facultatif)
				<textarea value={observation} onChange={(event) => setObservation(event.target.value)} disabled={isSubmitting} />
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
