"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import type { ReproductionPonte } from "@/app/features/production/reproduction/data/reproductionData";

export function PonteForm({
	basins,
	referenceSequence,
	onCancel,
	onSubmit,
}: {
	basins: string[];
	referenceSequence: number;
	onCancel: () => void;
	onSubmit: (ponte: ReproductionPonte) => void;
}) {
	const [basin, setBasin] = useState("");
	const [eggQuantity, setEggQuantity] = useState("");
	const [observation, setObservation] = useState("");
	const [status, setStatus] = useState("");
	const addedAtInput = useRef<HTMLInputElement>(null);
	const referenceInput = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (addedAtInput.current) {
			addedAtInput.current.value = getLocalDateTimeValue();
		}
		if (referenceInput.current) {
			referenceInput.current.value = getPonteReference(referenceSequence);
		}
	}, [referenceSequence]);

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const reference = formData.get("reference");
		const addedAt = formData.get("addedAt");
		if (
			typeof reference !== "string" || !reference ||
			typeof addedAt !== "string" || !addedAt
		) {
			return;
		}

		onSubmit({
			basin,
			reference,
			addedAt,
			eggQuantity: Number(eggQuantity),
			observation: observation.trim(),
		});
	}

	return (
		<form className="form-card wide reproduction-entry-form" onSubmit={handleSubmit}>
			<h2>Enregistrer une ponte</h2>
			<div className="form-grid">
				<label>
					Bassin
					<select value={basin} onChange={(event) => setBasin(event.target.value)} required>
						<option value="" disabled>Sélectionner un bassin</option>
						{basins.map((availableBasin) => (
							<option key={availableBasin} value={availableBasin}>{availableBasin}</option>
						))}
					</select>
				</label>
				<label>
					Référence ponte
					<input type="text" name="reference" ref={referenceInput} readOnly required />
				</label>
				<label>
					Date de l&apos;ajout
					<input type="datetime-local" name="addedAt" ref={addedAtInput} required />
				</label>
				<label>
					Quantité d&apos;œufs obtenus
					<input
						type="number"
						name="eggQuantity"
						min="0"
						step="any"
						inputMode="decimal"
						value={eggQuantity}
						onChange={(event) => setEggQuantity(event.target.value)}
						required
					/>
				</label>
			</div>
			<label>
				Observation
				<textarea
					name="observation"
					value={observation}
					onChange={(event) => setObservation(event.target.value)}
					placeholder="Ajouter une observation (facultatif)"
				/>
			</label>
			<div className="form-actions">
				<button className="button button-ghost" type="button" onClick={onCancel}>
					Annuler
				</button>
				<button className="button button-primary" type="submit">
					Enregistrer la ponte
				</button>
			</div>
		</form>
	);
}

function getLocalDateTimeValue() {
	const now = new Date();
	const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
	return localDate.toISOString().slice(0, 16);
}

function getPonteReference(sequence: number) {
	const today = new Date();
	const datePart = [
		today.getFullYear(),
		String(today.getMonth() + 1).padStart(2, "0"),
		String(today.getDate()).padStart(2, "0"),
	].join("");

	return `PON-${datePart}-${String(sequence).padStart(3, "0")}`;
}