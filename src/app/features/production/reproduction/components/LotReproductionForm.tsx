"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import type { ReproductionLot, ReproductionSpecies } from "@/app/features/production/reproduction/data/reproductionData";

export function LotReproductionForm({
	basins,
	referenceSequence,
	onCancel,
	onSubmit,
}: {
	basins: string[];
	referenceSequence: number;
	onCancel: () => void;
	onSubmit: (lot: ReproductionLot) => void;
}) {
	const [basin, setBasin] = useState("");
	const [species, setSpecies] = useState<ReproductionSpecies | "">("");
	const [maleQuantity, setMaleQuantity] = useState("");
	const [femaleQuantity, setFemaleQuantity] = useState("");
	const [observation, setObservation] = useState("");
	const addedAtInput = useRef<HTMLInputElement>(null);
	const referenceInput = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (addedAtInput.current) {
			addedAtInput.current.value = getLocalDateTimeValue();
		}
		if (referenceInput.current) {
			referenceInput.current.value = getLotReference(referenceSequence);
		}
	}, [referenceSequence]);

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const addedAt = formData.get("addedAt");
		const reference = formData.get("reference");
		if (
			!species ||
			typeof addedAt !== "string" || !addedAt ||
			typeof reference !== "string" || !reference
		) {
			return;
		}

		onSubmit({
			basin,
			reference,
			addedAt,
			species,
			maleQuantity: Number(maleQuantity),
			femaleQuantity: Number(femaleQuantity),
			observation: observation.trim(),
			status: "Actif",
		});
	}

	return (
		<form className="form-card wide reproduction-lot-form" onSubmit={handleSubmit}>
			<h2>Ajouter un lot de reproduction</h2>
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
					Référence du lot
					<input type="text" name="reference" ref={referenceInput} readOnly required />
				</label>
				<label>
					Date de l&apos;ajout
					<input
						type="date"
						name="addedAt"
						ref={addedAtInput}
						required
					/>
				</label>
				<label>
					Espèce
					<select
						value={species}
						onChange={(event) => setSpecies(event.target.value as ReproductionSpecies | "")}
						required
					>
						<option value="" disabled>Sélectionner une espèce</option>
						<option value="Carpe">Carpe</option>
						<option value="Tilapia">Tilapia</option>
					</select>
				</label>
				<label>
					Quantité de mâles
					<input
						type="number"
						name="quantite_male"
						min="0"
						step="1"
						value={maleQuantity}
						onChange={(event) => setMaleQuantity(event.target.value)}
						required
					/>
				</label>
				<label>
					Quantité de femelles
					<input
						type="number"
						name="quantite_femelle"
						min="0"
						step="1"
						value={femaleQuantity}
						onChange={(event) => setFemaleQuantity(event.target.value)}
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
					Ajouter le lot
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

function getLotReference(sequence: number) {
	const today = new Date();
	const datePart = [
		today.getFullYear(),
		String(today.getMonth() + 1).padStart(2, "0"),
		String(today.getDate()).padStart(2, "0"),
	].join("");

	return `LOT-${datePart}-${String(sequence).padStart(3, "0")}`;
}