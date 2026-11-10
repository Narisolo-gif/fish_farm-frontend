"use client";

import { type FormEvent, useState } from "react";
import type {
	PonteInput,
	ReproductionRecord,
} from "@/app/features/production/reproduction/types/reproduction.types";

export function PonteForm({
	reproductions,
	basinReferences,
	defaultReproductionId,
	isSubmitting,
	error,
	onCancel,
	onSubmit,
}: {
	reproductions: ReproductionRecord[];
	basinReferences: Record<number, string>;
	defaultReproductionId?: number;
	isSubmitting: boolean;
	error: string;
	onCancel: () => void;
	onSubmit: (ponte: PonteInput) => void;
}) {
	const [reproductionId, setReproductionId] = useState(
		defaultReproductionId !== undefined && reproductions.some((item) => item.id === defaultReproductionId)
			? String(defaultReproductionId)
			: "",
	);
	const [eggQuantity, setEggQuantity] = useState("");
	const [observation, setObservation] = useState("");
	const [reference, setReference] = useState("");
	const [date, setDate] = useState(getLocalDateValue());

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const reproduction = reproductions.find((item) => String(item.id) === reproductionId);
		if (!reproduction) {
			return;
		}

		onSubmit({
			reference: reference.trim(),
			bassin: reproduction.bassin,
			date_ponte: date,
			quantite_oeuf_obtenu: Number(eggQuantity),
			observation: observation.trim(),
		});
	}

	return (
		<form className="form-card wide reproduction-entry-form" onSubmit={handleSubmit}>
			<h2>Enregistrer une ponte</h2>
			<div className="form-grid">
				<label>
					Reproduction active
					<select
						value={reproductionId}
						onChange={(event) => setReproductionId(event.target.value)}
						required
						disabled={isSubmitting}
					>
						<option value="" disabled>Sélectionner une reproduction</option>
						{reproductions.map((reproduction) => (
							<option key={reproduction.id} value={reproduction.id}>
								{reproduction.reference} · {basinReferences[reproduction.bassin] ?? `Bassin ${reproduction.bassin}`}
							</option>
						))}
					</select>
				</label>
				<label>
					Référence ponte
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
					Date de ponte
					<input
						type="date"
						value={date}
						max={getLocalDateValue()}
						onChange={(event) => setDate(event.target.value)}
						required
						disabled={isSubmitting}
					/>
				</label>
				<label>
					Quantité d&apos;œufs obtenus
					<input
						type="number"
						min="0.01"
						step="0.01"
						inputMode="decimal"
						value={eggQuantity}
						onChange={(event) => setEggQuantity(event.target.value)}
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
				<button className="button button-primary" type="submit" disabled={isSubmitting || reproductions.length === 0}>
					{isSubmitting ? "Enregistrement..." : "Enregistrer la ponte"}
				</button>
			</div>
		</form>
	);
}

function getLocalDateValue() {
	const now = new Date();
	return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}
