"use client";

import { type FormEvent, useState } from "react";
import type { EnvironmentalBasin } from "@/app/features/production/shared/environnement/types/environment.types";
import type { ReproductionInput } from "@/app/features/production/reproduction/types/reproduction.types";

type LotField = keyof ReproductionInput;
type LotFieldErrors = Partial<Record<LotField, string>>;

// Mêmes messages que ReproductionSerializer (backend) pour rester cohérent.
const CAPACITY_EXCEEDED_MESSAGE = "La quantité totale de poissons dépasse la capacité du bassin.";

export function LotReproductionForm({
	basins,
	isSubmitting,
	error,
	fieldErrors = {},
	defaultBasinId,
	onCancel,
	onSubmit,
}: {
	basins: Pick<EnvironmentalBasin, "id" | "reference" | "capacity">[];
	isSubmitting: boolean;
	error: string;
	fieldErrors?: Record<string, string[]>;
	defaultBasinId?: number | null;
	onCancel: () => void;
	onSubmit: (lot: ReproductionInput) => void;
}) {
	const [basin, setBasin] = useState(
		defaultBasinId != null && basins.some((item) => item.id === defaultBasinId)
			? String(defaultBasinId)
			: "",
	);
	const [species, setSpecies] = useState<"CARPE" | "TILAPIA" | "">("");
	const [maleQuantity, setMaleQuantity] = useState("");
	const [femaleQuantity, setFemaleQuantity] = useState("");
	const [observation, setObservation] = useState("");
	const [reference, setReference] = useState("");
	const [addedAt, setAddedAt] = useState(getLocalDateValue());
	const [clientErrors, setClientErrors] = useState<LotFieldErrors>({});
	// Champs modifiés depuis la dernière réponse du serveur : leur erreur serveur n'est plus affichée.
	const [editedFields, setEditedFields] = useState<Set<LotField>>(new Set());
	const [lastServerErrors, setLastServerErrors] = useState(fieldErrors);

	if (lastServerErrors !== fieldErrors) {
		setLastServerErrors(fieldErrors);
		setEditedFields(new Set());
	}

	const selectedBasin = basins.find((availableBasin) => String(availableBasin.id) === basin);
	const males = parsePositiveInteger(maleQuantity);
	const females = parsePositiveInteger(femaleQuantity);
	const total = (males ?? 0) + (females ?? 0);
	const remaining = selectedBasin ? selectedBasin.capacity - total : null;
	const exceedsCapacity = remaining !== null && remaining < 0;

	function fieldError(field: LotField) {
		if (clientErrors[field]) {
			return clientErrors[field];
		}
		if (field === "quantite_male" && exceedsCapacity) {
			return CAPACITY_EXCEEDED_MESSAGE;
		}
		return editedFields.has(field) ? undefined : fieldErrors[field]?.[0];
	}

	function markEdited(...fields: LotField[]) {
		setClientErrors((current) => {
			const next = { ...current };
			fields.forEach((field) => delete next[field]);
			return next;
		});
		setEditedFields((current) => new Set([...current, ...fields]));
	}

	function validate(): LotFieldErrors {
		const errors: LotFieldErrors = {};
		if (!selectedBasin) {
			errors.bassin = "Le bassin est obligatoire.";
		}
		if (!reference.trim()) {
			errors.reference = "La référence est obligatoire.";
		}
		if (!addedAt) {
			errors.date_ajout = "La date d'ajout est obligatoire.";
		} else if (addedAt > getLocalDateValue()) {
			errors.date_ajout = "La date d'ajout ne peut pas être dans le futur.";
		}
		if (!species) {
			errors.espece = "L'espèce est obligatoire.";
		}
		if (males === null) {
			errors.quantite_male = "La quantité de mâles doit être supérieure ou égale à 1.";
		}
		if (females === null) {
			errors.quantite_femelle = "La quantité de femelles doit être supérieure ou égale à 1.";
		}
		if (!errors.quantite_male && exceedsCapacity) {
			errors.quantite_male = CAPACITY_EXCEEDED_MESSAGE;
		}
		return errors;
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const errors = validate();
		setClientErrors(errors);
		if (Object.keys(errors).length > 0 || !species || males === null || females === null) {
			return;
		}

		onSubmit({
			bassin: Number(basin),
			reference: reference.trim(),
			date_ajout: addedAt,
			espece: species,
			quantite_male: males,
			quantite_femelle: females,
			observation: observation.trim(),
		});
	}

	return (
		<form className="form-card wide reproduction-lot-form" onSubmit={handleSubmit} noValidate>
			<h2>Ajouter un lot de reproduction</h2>
			<div className="form-grid">
				<label>
					Bassin
					<select
						value={basin}
						onChange={(event) => {
							setBasin(event.target.value);
							markEdited("bassin", "quantite_male");
						}}
						required
						disabled={isSubmitting}
						aria-invalid={Boolean(fieldError("bassin"))}
					>
						<option value="" disabled>Sélectionner un bassin</option>
						{basins.map((availableBasin) => (
							<option key={availableBasin.id} value={availableBasin.id}>
								{availableBasin.reference} — capacité {availableBasin.capacity.toLocaleString("fr-FR")}
							</option>
						))}
					</select>
					<FieldError message={fieldError("bassin")} />
					{selectedBasin && (
						<span className={`field-hint${exceedsCapacity ? " is-invalid" : ""}`}>
							Capacité : {selectedBasin.capacity.toLocaleString("fr-FR")} poissons · Saisis :{" "}
							{total.toLocaleString("fr-FR")} · Places restantes : {(remaining ?? 0).toLocaleString("fr-FR")}
						</span>
					)}
				</label>
				<label>
					Référence de la reproduction
					<input
						type="text"
						value={reference}
						onChange={(event) => {
							setReference(event.target.value);
							markEdited("reference");
						}}
						maxLength={100}
						required
						disabled={isSubmitting}
						aria-invalid={Boolean(fieldError("reference"))}
					/>
					<FieldError message={fieldError("reference")} />
				</label>
				<label>
					Date d&apos;ajout
					<input
						type="date"
						value={addedAt}
						max={getLocalDateValue()}
						onChange={(event) => {
							setAddedAt(event.target.value);
							markEdited("date_ajout");
						}}
						required
						disabled={isSubmitting}
						aria-invalid={Boolean(fieldError("date_ajout"))}
					/>
					<FieldError message={fieldError("date_ajout")} />
				</label>
				<label>
					Espèce
					<select
						value={species}
						onChange={(event) => {
							setSpecies(event.target.value as "CARPE" | "TILAPIA" | "");
							markEdited("espece");
						}}
						required
						disabled={isSubmitting}
						aria-invalid={Boolean(fieldError("espece"))}
					>
						<option value="" disabled>Sélectionner une espèce</option>
						<option value="CARPE">Carpe</option>
						<option value="TILAPIA">Tilapia</option>
					</select>
					<FieldError message={fieldError("espece")} />
				</label>
				<label>
					Quantité de mâles
					<input
						type="number"
						min="1"
						step="1"
						value={maleQuantity}
						onChange={(event) => {
							setMaleQuantity(event.target.value);
							markEdited("quantite_male");
						}}
						required
						disabled={isSubmitting}
						aria-invalid={Boolean(fieldError("quantite_male"))}
					/>
					<FieldError message={fieldError("quantite_male")} />
				</label>
				<label>
					Quantité de femelles
					<input
						type="number"
						min="1"
						step="1"
						value={femaleQuantity}
						onChange={(event) => {
							setFemaleQuantity(event.target.value);
							// Le backend rattache l'erreur de capacité à quantite_male.
							markEdited("quantite_femelle", "quantite_male");
						}}
						required
						disabled={isSubmitting}
						aria-invalid={Boolean(fieldError("quantite_femelle"))}
					/>
					<FieldError message={fieldError("quantite_femelle")} />
				</label>
			</div>
			<label>
				Observation
				<textarea
					value={observation}
					onChange={(event) => {
						setObservation(event.target.value);
						markEdited("observation");
					}}
					placeholder="Ajouter une observation (facultatif)"
					disabled={isSubmitting}
				/>
				<FieldError message={fieldError("observation")} />
			</label>
			{error && <p className="form-error" role="alert">{error}</p>}
			<div className="form-actions">
				<button className="button button-ghost" type="button" onClick={onCancel} disabled={isSubmitting}>
					Annuler
				</button>
				<button
					className="button button-primary"
					type="submit"
					disabled={isSubmitting || basins.length === 0 || exceedsCapacity}
				>
					{isSubmitting ? "Enregistrement..." : "Ajouter le lot"}
				</button>
			</div>
		</form>
	);
}

function FieldError({ message }: { message?: string }) {
	return message ? <span className="field-error" role="alert">{message}</span> : null;
}

function parsePositiveInteger(value: string): number | null {
	if (!/^\d+$/.test(value.trim())) {
		return null;
	}
	const parsed = Number(value);
	return Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : null;
}

function getLocalDateValue() {
	const now = new Date();
	return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}
