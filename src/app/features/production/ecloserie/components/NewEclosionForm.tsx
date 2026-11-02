"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/apiClient";
import type { PonteRecord } from "@/app/features/production/reproduction/types/reproduction.types";

type ApiListResponse<T> = T[] | { results: T[] };

export function NewEclosionForm() {
	const router = useRouter();
	const [pontes, setPontes] = useState<PonteRecord[]>([]);
	const [isLoadingPontes, setIsLoadingPontes] = useState(true);
	const [pontesError, setPontesError] = useState("");
	const [ponteReference, setPonteReference] = useState("");
	const [saveError, setSaveError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [hatchingDate, setHatchingDate] = useState(getLocalDateValue);

	useEffect(() => {
		let isActive = true;

		void Promise.resolve().then(async () => {
			const accessToken = localStorage.getItem("access_token");
			if (!accessToken) {
				if (isActive) {
					setPontesError("Votre session a expiré. Veuillez vous reconnecter.");
					setIsLoadingPontes(false);
				}
				return;
			}

			try {
				const response = await apiRequest<ApiListResponse<PonteRecord>>(
					"/api/v1/reproduction/pontes/",
					{ headers: { Authorization: `Bearer ${accessToken}` } },
				);
				if (isActive) {
					setPontes(Array.isArray(response) ? response : response.results);
				}
			} catch (error) {
				if (isActive) {
					setPontesError(
						error instanceof Error
							? error.message
							: "Impossible de charger les pontes enregistrées.",
					);
				}
			} finally {
				if (isActive) {
					setIsLoadingPontes(false);
				}
			}
		});

		return () => {
			isActive = false;
		};
	}, []);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		const formData = new FormData(form);
		const reference = formData.get("reference");
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
			!hatchingDate
		) {
			setSaveError("Vérifiez les champs obligatoires et sélectionnez une ponte enregistrée.");
			return;
		}

		const fryQuantity = Number(fryQuantityValue);
		const hatchedEggQuantity = hatchedEggQuantityValue ? Number(hatchedEggQuantityValue) : null;
		if (
			!Number.isInteger(fryQuantity) ||
			fryQuantity <= 0 ||
			(hatchedEggQuantity !== null && (!Number.isFinite(hatchedEggQuantity) || hatchedEggQuantity <= 0))
		) {
			setSaveError("La quantité d'alevins doit être un entier supérieur à 0 et la quantité d'œufs éclos, si renseignée, doit être supérieure à 0.");
			return;
		}

		const accessToken = localStorage.getItem("access_token");
		if (!accessToken) {
			setSaveError("Votre session a expiré. Veuillez vous reconnecter.");
			return;
		}

		setIsSubmitting(true);
		setSaveError("");

		try {
			await apiRequest("/api/v1/ecloserie/", {
				method: "POST",
				headers: { Authorization: `Bearer ${accessToken}` },
				body: JSON.stringify({
					reference: reference.trim(),
					reference_ponte: selectedPonte.reference,
					date_eclosion: hatchingDate,
					quantite_oeufs_eclos: hatchedEggQuantity,
					quantite_alevins_obtenu: fryQuantity,
					observation: observation.trim(),
				}),
			});
			router.push("/production/ecloserie");
		} catch (error) {
			setSaveError(error instanceof Error ? error.message : "Impossible d'enregistrer cette éclosion.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form className="form-card wide reproduction-entry-form" onSubmit={handleSubmit}>
			<h2>Nouvelle éclosion</h2>
			{pontesError && <p className="form-error" role="alert">{pontesError}</p>}
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
					<input name="reference" type="text" maxLength={100} required disabled={isSubmitting} />
				</label>
				<label>
					Date d&apos;éclosion
					<input
						name="hatchingDate"
						type="date"
						value={hatchingDate}
						onChange={(event) => setHatchingDate(event.target.value)}
						max={getLocalDateValue()}
						required
						disabled={isSubmitting}
					/>
				</label>
				<label>
					Quantité d&apos;alevins obtenue
					<input
						name="fryQuantity"
						type="number"
						min="1"
						step="1"
						inputMode="decimal"
						required
						disabled={isSubmitting}
					/>
				</label>
				<label>
					Quantité d&apos;œufs éclos (facultatif)
					<input
						name="hatchedEggQuantity"
						type="number"
						min="0.01"
						step="0.01"
						inputMode="decimal"
						disabled={isSubmitting}
					/>
				</label>
			</div>
			<label>
				Observation
				<textarea name="observation" disabled={isSubmitting} />
			</label>
			{saveError && <p className="form-error" role="alert">{saveError}</p>}
			<div className="form-actions">
				<button className="button button-ghost" type="button" onClick={() => router.push("/production/ecloserie")} disabled={isSubmitting}>
					Annuler
				</button>
				<button
					className="button button-primary"
					type="submit"
					disabled={isLoadingPontes || Boolean(pontesError) || pontes.length === 0 || isSubmitting}
				>
					{isSubmitting ? "Enregistrement..." : "Enregistrer l'éclosion"}
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
