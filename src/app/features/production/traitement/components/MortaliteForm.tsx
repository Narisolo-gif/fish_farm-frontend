"use client";

import { FormEvent, useState } from "react";

export function MortaliteForm({
	onCancel,
	onSubmit,
}: {
	onCancel: () => void;
	onSubmit: (date: string, deaths: number, observation: string) => void;
}) {
	const [date, setDate] = useState("");
	const [deaths, setDeaths] = useState("");
	const [observation, setObservation] = useState("");

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		onSubmit(date, Number(deaths), observation.trim());
	}

	return (
		<form className="form-card wide treatment-record-form" onSubmit={handleSubmit}>
			<h3>Ajouter une mortalité</h3>
			<div className="form-grid">
				<label>
					Date
					<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
				</label>
				<label>
					Nombre de morts
					<input
						type="number"
						min="1"
						step="1"
						value={deaths}
						onChange={(event) => setDeaths(event.target.value)}
						required
					/>
				</label>
				<label className="treatment-observation-field">
					Observation / cause
					<textarea value={observation} onChange={(event) => setObservation(event.target.value)} />
				</label>
			</div>
			<p className="helper-text">Cette saisie est locale et ne sera pas conservée après rechargement.</p>
			<div className="form-actions">
				<button className="button button-ghost" type="button" onClick={onCancel}>Annuler</button>
				<button className="button button-primary" type="submit">Ajouter</button>
			</div>
		</form>
	);
}