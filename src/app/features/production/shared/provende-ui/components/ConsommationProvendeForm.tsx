"use client";

import { FormEvent, useState } from "react";

export type NewConsommationProvende = {
	date: string;
	reference: string;
	consumptionGrams: number;
};

export function ConsommationProvendeForm({
	onCancel,
	onSubmit,
}: {
	onCancel: () => void;
	onSubmit: (entry: NewConsommationProvende) => void;
}) {
	const [date, setDate] = useState("");
	const [reference, setReference] = useState("");
	const [consumptionGrams, setConsumptionGrams] = useState("");

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		onSubmit({ date, reference: reference.trim(), consumptionGrams: Number(consumptionGrams) });
	}

	return (
		<form className="form-card wide treatment-record-form" onSubmit={handleSubmit}>
			<h3>Ajouter une consommation</h3>
			<div className="form-grid">
				<label>
					Date
					<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
				</label>
				<label>
					Référence provende
					<input value={reference} onChange={(event) => setReference(event.target.value)} required />
				</label>
				<label>
					Consommation (g)
					<input
						type="number"
						min="1"
						step="1"
						value={consumptionGrams}
						onChange={(event) => setConsumptionGrams(event.target.value)}
						required
					/>
				</label>
			</div>
			<p className="helper-text">Cette saisie est locale et ne sera pas conservée après rechargement.</p>
			<div className="form-actions">
				<button className="button button-ghost" type="button" onClick={onCancel}>Annuler</button>
				<button className="button button-primary" type="submit">Ajouter la consommation</button>
			</div>
		</form>
	);
}