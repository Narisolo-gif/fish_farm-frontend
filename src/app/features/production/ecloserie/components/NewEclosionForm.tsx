"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isEclosionRecord, type EclosionRecord } from "@/app/features/production/ecloserie/data/ecloserieData";
import { isReproductionPonte } from "@/app/features/production/reproduction/data/reproductionData";
import { productionStorageKeys, useLocalRecords, writeLocalRecords } from "@/app/features/production/shared/data/localProductionRecords";

export function NewEclosionForm() {
	const router = useRouter();
	const pontesSnapshot = useLocalRecords(productionStorageKeys.reproductionPontes, isReproductionPonte);
	const eclosionsSnapshot = useLocalRecords(productionStorageKeys.eclosions, isEclosionRecord);
	const pontes = pontesSnapshot.records;
	const isLoadingPontes = !pontesSnapshot.isReady;
	const pontesError = pontesSnapshot.error;
	const [ponteReference, setPonteReference] = useState("");
	const [saveError, setSaveError] = useState("");
	const hatchingDateInput = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (hatchingDateInput.current) {
			hatchingDateInput.current.value = getLocalDateValue();
		}
	}, []);

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		const formData = new FormData(form);
		const reference = formData.get("reference");
		const hatchingDate = formData.get("hatchingDate");
		const fryQuantityValue = formData.get("fryQuantity");
		const hatchedEggQuantityValue = formData.get("hatchedEggQuantity");
		const observation = formData.get("observation");
		const selectedPonte = pontes.find((ponte) => ponte.reference === ponteReference);

		if (
			typeof reference !== "string" ||
			!reference.trim() ||
			typeof fryQuantityValue !== "string" ||
			!fryQuantityValue ||
			typeof hatchedEggQuantityValue !== "string" ||
			typeof observation !== "string" ||
			!selectedPonte ||
			typeof hatchingDate !== "string" ||
			!hatchingDate
		) {
			setSaveError("Vérifiez les champs obligatoires et sélectionnez une ponte enregistrée.");
			return;
		}

		const fryQuantity = Number(fryQuantityValue);
		const hatchedEggQuantity = hatchedEggQuantityValue ? Number(hatchedEggQuantityValue) : null;
		if (
			!Number.isFinite(fryQuantity) ||
			fryQuantity < 0 ||
			(hatchedEggQuantity !== null && (!Number.isFinite(hatchedEggQuantity) || hatchedEggQuantity < 0))
		) {
			setSaveError("Les quantités doivent être des nombres positifs ou nuls.");
			return;
		}

		const eclosion: EclosionRecord = {
			reference: reference.trim(),
			ponteReference: selectedPonte.reference,
			hatchingDate,
			fryQuantity,
			hatchedEggQuantity,
			observation: observation.trim(),
		};

		try {
			if (eclosionsSnapshot.error) {
				setSaveError(eclosionsSnapshot.error);
				return;
			}
			writeLocalRecords(productionStorageKeys.eclosions, [eclosion, ...eclosionsSnapshot.records]);
			router.push("/production/ecloserie");
		} catch (error) {
			setSaveError(error instanceof Error ? error.message : "Impossible d'enregistrer cette éclosion.");
		}
	}

	return (
		<form className="form-card wide reproduction-entry-form" onSubmit={handleSubmit}>
			<h2>Nouvelle éclosion</h2>
			{pontesError && <p className="form-error" role="alert">{pontesError}</p>}
			{eclosionsSnapshot.error && <p className="form-error" role="alert">{eclosionsSnapshot.error}</p>}
			{!pontesError && !isLoadingPontes && pontes.length === 0 && (
				<p className="form-error" role="status">
					Aucune ponte enregistrée. Enregistrez d&apos;abord une ponte dans le module Reproduction.
				</p>
			)}
			<div className="form-grid">
				<label>
					Référence ponte
					<select
						name="ponteReference"
						value={ponteReference}
						onChange={(event) => setPonteReference(event.target.value)}
						required
						disabled={isLoadingPontes || Boolean(pontesError) || pontes.length === 0}
					>
						<option value="" disabled>Sélectionner une ponte enregistrée</option>
						{pontes.map((ponte) => (
							<option key={ponte.reference} value={ponte.reference}>{ponte.reference}</option>
						))}
					</select>
				</label>
				<label>
					Référence éclosion
					<input name="reference" type="text" required />
				</label>
				<label>
					Date d&apos;éclosion
					<input name="hatchingDate" type="date" ref={hatchingDateInput} readOnly required />
				</label>
				<label>
					Quantité d&apos;alevins obtenue
					<input
						name="fryQuantity"
						type="number"
						min="0"
						step="any"
						inputMode="decimal"
						required
					/>
				</label>
				<label>
					Quantité d&apos;œufs éclos (facultatif)
					<input
						name="hatchedEggQuantity"
						type="number"
						min="0"
						step="any"
						inputMode="decimal"
					/>
				</label>
			</div>
			<label>
				Observation
				<textarea name="observation" />
			</label>
			{saveError && <p className="form-error" role="alert">{saveError}</p>}
			<div className="form-actions">
				<button className="button button-ghost" type="button" onClick={() => router.push("/production/ecloserie")}>
					Annuler
				</button>
				<button
					className="button button-primary"
					type="submit"
					disabled={isLoadingPontes || !eclosionsSnapshot.isReady || Boolean(pontesError) || Boolean(eclosionsSnapshot.error) || pontes.length === 0}
				>
					Enregistrer l&apos;éclosion
				</button>
			</div>
		</form>
	);
}

function getLocalDateValue() {
	const now = new Date();
	const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
	return localDate.toISOString().slice(0, 10);
}
