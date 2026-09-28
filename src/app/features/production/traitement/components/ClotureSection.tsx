"use client";

import { useState } from "react";
import { DataTable } from "@/components/DataTable";

export function ClotureSection({
	traitementId,
	isClosed,
	onClose,
}: {
	traitementId: string;
	isClosed: boolean;
	onClose: () => void;
}) {
	const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

	return (
		<section className="treatment-closure" aria-labelledby="treatment-closure-title">
			<h2 id="treatment-closure-title">Récapitulatif du traitement</h2>
			<DataTable
				className="treatment-journal-table"
				headers={[
					"Référence",
					"Lot",
					"Date entrée",
					"Effectif initial",
					"Effectif actuel",
					"Action",
				]}
				rows={[[
					traitementId,
					"—",
					"—",
					"—",
					"—",
					isClosed ? (
						<span className="badge badge-amber">Clôturé</span>
					) : (
						<button
							className="button button-primary table-action"
							type="button"
							onClick={() => setIsConfirmationOpen(true)}
						>
							Clôturer
						</button>
					),
				]]}
			/>

			{!isClosed && <p className="helper-text">Les informations manquantes seront renseignées après connexion aux données du traitement.</p>}
			{isClosed && <p className="helper-text" role="status">Traitement clôturé dans cette interface. Cette modification n'est pas enregistrée par une API.</p>}

			{isConfirmationOpen && (
				<div className="treatment-confirmation-backdrop">
					<section
						className="treatment-confirmation-dialog"
						role="dialog"
						aria-modal="true"
						aria-labelledby="confirm-treatment-closure-title"
						aria-describedby="confirm-treatment-closure-description"
					>
						<h3 id="confirm-treatment-closure-title">Confirmer la clôture</h3>
						<p id="confirm-treatment-closure-description">
							Voulez-vous clôturer le traitement {traitementId} ? Le statut sera modifié dans cette interface uniquement.
						</p>
						<div className="form-actions">
							<button className="button button-ghost" type="button" onClick={() => setIsConfirmationOpen(false)}>
								Annuler
							</button>
							<button
								className="button button-primary"
								type="button"
								onClick={() => {
									setIsConfirmationOpen(false);
									onClose();
								}}
							>
								Confirmer la clôture
							</button>
						</div>
					</section>
				</div>
			)}
		</section>
	);
}