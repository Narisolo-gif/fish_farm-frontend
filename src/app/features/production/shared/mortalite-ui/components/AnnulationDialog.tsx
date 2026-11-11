"use client";

import { type FormEvent, useState } from "react";

/** Dialogue de saisie du motif d'annulation (obligatoire côté backend). */
export function AnnulationDialog({
	title,
	description,
	onConfirm,
	onClose,
}: {
	title: string;
	description: string;
	onConfirm: (motif: string) => Promise<void>;
	onClose: () => void;
}) {
	const [motif, setMotif] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!motif.trim()) {
			setError("Le motif d'annulation est obligatoire.");
			return;
		}
		setIsSubmitting(true);
		setError("");
		try {
			await onConfirm(motif.trim());
		} catch (confirmError) {
			setError(confirmError instanceof Error ? confirmError.message : "Impossible d'annuler.");
			setIsSubmitting(false);
		}
	}

	return (
		<div className="user-dialog-backdrop" role="presentation" onClick={() => !isSubmitting && onClose()}>
			<form
				className="user-dialog"
				role="dialog"
				aria-modal="true"
				aria-labelledby="annulation-dialog-title"
				onClick={(event) => event.stopPropagation()}
				onSubmit={handleSubmit}
			>
				<h2 id="annulation-dialog-title">{title}</h2>
				<p className="helper-text">{description}</p>
				<label>
					Motif d&apos;annulation
					<input
						type="text"
						value={motif}
						onChange={(event) => setMotif(event.target.value)}
						required
						autoFocus
						disabled={isSubmitting}
					/>
				</label>
				{error && <p className="form-error" role="alert">{error}</p>}
				<div className="form-actions">
					<button className="button button-ghost" type="button" onClick={onClose} disabled={isSubmitting}>
						Fermer
					</button>
					<button className="button button-danger" type="submit" disabled={isSubmitting}>
						{isSubmitting ? "Annulation..." : "Confirmer l'annulation"}
					</button>
				</div>
			</form>
		</div>
	);
}
