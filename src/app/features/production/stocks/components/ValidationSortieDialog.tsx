"use client";

import { type FormEvent, useEffect, useState } from "react";
import { ApiError } from "@/lib/apiClient";
import { DataTable } from "@/components/DataTable";
import { getApercuSortie, validerSortie } from "@/app/features/production/stocks/services/sortieStockApi";
import type { ApercuSortie, SortieStock } from "@/app/features/production/stocks/types/sortieStock.types";

/** Validation d'un brouillon : aperçu des hapas vidés, effectif entrant en grossissement, justification d'écart. */
export function ValidationSortieDialog({
	sortie,
	onValidated,
	onClose,
}: {
	sortie: SortieStock;
	onValidated: () => Promise<void>;
	onClose: () => void;
}) {
	const [apercu, setApercu] = useState<ApercuSortie | null>(null);
	const [loadError, setLoadError] = useState("");
	const [effectifEntrant, setEffectifEntrant] = useState("");
	const [justification, setJustification] = useState("");
	const [error, setError] = useState("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		let isActive = true;
		getApercuSortie(sortie.id)
			.then((result) => {
				if (!isActive) return;
				setApercu(result);
				setEffectifEntrant(String(result.effectif_sortant));
			})
			.catch((apercuError: unknown) => {
				if (isActive) {
					setLoadError(apercuError instanceof Error ? apercuError.message : "Impossible de calculer l'aperçu.");
				}
			});
		return () => {
			isActive = false;
		};
	}, [sortie.id]);

	const effectifSortant = apercu?.effectif_sortant ?? 0;
	const entrant = Number(effectifEntrant);
	const hasEcart = effectifEntrant.trim() !== "" && entrant !== effectifSortant;

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		setFieldErrors({});
		if (!Number.isInteger(entrant) || entrant <= 0) {
			setError("L'effectif entrant doit être positif.");
			return;
		}
		if (entrant > effectifSortant) {
			setError("L'effectif entrant ne peut pas dépasser l'effectif sortant.");
			return;
		}
		if (hasEcart && !justification.trim()) {
			setError("Une justification est obligatoire en cas d'écart.");
			return;
		}
		setIsSubmitting(true);
		try {
			await validerSortie(sortie.id, { effectif_entrant: entrant, justification_ecart: justification.trim() });
			await onValidated();
		} catch (submitError) {
			if (submitError instanceof ApiError) {
				setFieldErrors(submitError.fieldErrors);
			}
			setError(submitError instanceof Error ? submitError.message : "Impossible de valider la sortie.");
			setIsSubmitting(false);
		}
	}

	return (
		<div className="user-dialog-backdrop" role="presentation" onClick={() => !isSubmitting && onClose()}>
			<form
				className="user-dialog"
				role="dialog"
				aria-modal="true"
				aria-labelledby="validation-sortie-title"
				onClick={(event) => event.stopPropagation()}
				onSubmit={handleSubmit}
			>
				<h2 id="validation-sortie-title">Valider la sortie</h2>
				<p className="helper-text">
					Le lot {sortie.reference_lot} sera transféré vers le bassin {sortie.reference_bassin_destination} : un lot
					de grossissement est créé et le lot passe au stade « En grossissement ».
				</p>
				{loadError ? (
					<p className="form-error" role="alert">{loadError}</p>
				) : !apercu ? (
					<p className="list-empty-state" role="status">Calcul de l&apos;effectif sortant…</p>
				) : (
					<>
						<DataTable
							className="ecloserie-table"
							headers={["Hapa", "Effectif sortant"]}
							rows={[
								...apercu.lignes.map((ligne) => [ligne.nom_hapa, ligne.quantite.toLocaleString("fr-FR")]),
								["Total", effectifSortant.toLocaleString("fr-FR")],
							]}
						/>
						<label>
							Effectif entrant en grossissement
							<input
								type="number"
								min="1"
								max={effectifSortant}
								step="1"
								value={effectifEntrant}
								onChange={(event) => setEffectifEntrant(event.target.value)}
								required
								disabled={isSubmitting}
							/>
							{fieldErrors.effectif_entrant && (
								<small className="form-error">{fieldErrors.effectif_entrant.join(" ")}</small>
							)}
						</label>
						{hasEcart && (
							<label>
								Justification de l&apos;écart ({(entrant - effectifSortant).toLocaleString("fr-FR")})
								<textarea
									value={justification}
									onChange={(event) => setJustification(event.target.value)}
									required
									disabled={isSubmitting}
								/>
								{fieldErrors.justification_ecart && (
									<small className="form-error">{fieldErrors.justification_ecart.join(" ")}</small>
								)}
							</label>
						)}
					</>
				)}
				{error && <p className="form-error" role="alert">{error}</p>}
				<div className="form-actions">
					<button className="button button-ghost" type="button" onClick={onClose} disabled={isSubmitting}>
						Fermer
					</button>
					<button className="button button-primary" type="submit" disabled={isSubmitting || !apercu}>
						{isSubmitting ? "Validation..." : "Valider la sortie"}
					</button>
				</div>
			</form>
		</div>
	);
}
