"use client";

import { type FormEvent, useState } from "react";
import type { EnvironmentalBasin } from "@/app/features/production/shared/environnement/types/environment.types";
import type { ReproductionInput } from "@/app/features/production/reproduction/types/reproduction.types";

export function LotReproductionForm({
	basins,
	isSubmitting,
	error,
	onCancel,
	onSubmit,
}: {
	basins: Pick<EnvironmentalBasin, "id" | "reference">[];
	isSubmitting: boolean;
	error: string;
	onCancel: () => void;
	onSubmit: (lot: ReproductionInput) => void;
}) {
	const [basin, setBasin] = useState("");
	const [species, setSpecies] = useState<"CARPE" | "TILAPIA" | "">("");
	const [maleQuantity, setMaleQuantity] = useState("");
	const [femaleQuantity, setFemaleQuantity] = useState("");
	const [observation, setObservation] = useState("");
	const [reference, setReference] = useState("");
	const [addedAt, setAddedAt] = useState(getLocalDateValue());

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!species) {
			return;
		}

		onSubmit({
			bassin: Number(basin),
			reference: reference.trim(),
			date_ajout: addedAt,
			espece: species,
			quantite_male: Number(maleQuantity),
			quantite_femelle: Number(femaleQuantity),
			observation: observation.trim(),
		});
	}

	return (
		<form className="form-card wide reproduction-lot-form" onSubmit={handleSubmit}>
			<h2>Ajouter un lot de reproduction</h2>
			<div className="form-grid">
				<label>
					Bassin
					<select value={basin} onChange={(event) => setBasin(event.target.value)} required disabled={isSubmitting}>
						<option value="" disabled>Sélectionner un bassin</option>
						{basins.map((availableBasin) => (
							<option key={availableBasin.id} value={availableBasin.id}>
								{availableBasin.reference}
							</option>
						))}
					</select>
				</label>
				<label>
					Référence de la reproduction
					<input
						type="text"
						value={reference}
						onChange={(event) => setReference(event.target.value)}
						maxLength={100}
						required
						disabled={isSubmitting}
					/>
				</label>
				<label>
					Date d&apos;ajout
					<input
						type="date"
						value={addedAt}
						max={getLocalDateValue()}
						onChange={(event) => setAddedAt(event.target.value)}
						required
						disabled={isSubmitting}
					/>
				</label>
				<label>
					Espèce
					<select
						value={species}
						onChange={(event) => setSpecies(event.target.value as "CARPE" | "TILAPIA" | "")}
						required
						disabled={isSubmitting}
					>
						<option value="" disabled>Sélectionner une espèce</option>
						<option value="CARPE">Carpe</option>
						<option value="TILAPIA">Tilapia</option>
					</select>
				</label>
				<label>
					Quantité de mâles
					<input
						type="number"
						min="1"
						step="1"
						value={maleQuantity}
						onChange={(event) => setMaleQuantity(event.target.value)}
						required
						disabled={isSubmitting}
					/>
				</label>
				<label>
					Quantité de femelles
					<input
						type="number"
						min="1"
						step="1"
						value={femaleQuantity}
						onChange={(event) => setFemaleQuantity(event.target.value)}
						required
						disabled={isSubmitting}
					/>
				</label>
			</div>
			<label>
				Observation
				<textarea
					value={observation}
					onChange={(event) => setObservation(event.target.value)}
					placeholder="Ajouter une observation (facultatif)"
					disabled={isSubmitting}
				/>
			</label>
			{error && <p className="form-error" role="alert">{error}</p>}
			<div className="form-actions">
				<button className="button button-ghost" type="button" onClick={onCancel} disabled={isSubmitting}>
					Annuler
				</button>
				<button className="button button-primary" type="submit" disabled={isSubmitting || basins.length === 0}>
					{isSubmitting ? "Enregistrement..." : "Ajouter le lot"}
				</button>
			</div>
		</form>
	);
}

function getLocalDateValue() {
	const now = new Date();
	return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}
