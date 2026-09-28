"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui";
import { BassinSelector } from "@/app/features/production/shared/bassins/components/BassinSelector";
import { LotSelector } from "@/app/features/production/shared/lot/components/LotSelector";

export function TraitementForm() {
	const [lotId, setLotId] = useState("");
	const [basin, setBasin] = useState("");
	const [startDate, setStartDate] = useState("");
	const [observation, setObservation] = useState("");
	const [message, setMessage] = useState("");

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setMessage("Le formulaire est valide, mais l'enregistrement n'est pas encore connecté à l'API.");
	}

	return (
		<form className="form-card wide" onSubmit={handleSubmit}>
			<div className="form-grid">
				<LotSelector value={lotId} onChange={setLotId} />
				<BassinSelector value={basin} onChange={setBasin} />
				<label>
					Date de début
					<input
						type="date"
						value={startDate}
						onChange={(event) => setStartDate(event.target.value)}
						required
					/>
				</label>
				<label>
					Observation
					<input
						type="text"
						value={observation}
						onChange={(event) => setObservation(event.target.value)}
						placeholder="Ajouter une observation"
					/>
				</label>
			</div>
			<p className="helper-text">Les lots et bassins affichés sont des exemples en attente de connexion aux données de production.</p>
			{message && <p className="helper-text" role="status">{message}</p>}
			<div className="form-actions">
				<Button variant="ghost" href="/production/traitement">Annuler</Button>
				<button className="button button-primary" type="submit">Ouvrir le traitement</button>
			</div>
		</form>
	);
}