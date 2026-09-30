"use client";

import { useState } from "react";
import { DataTable } from "@/components/DataTable";

export function StockClotureSection({
    lotStockageId,
    isClosed,
    onClose,
}: {
    lotStockageId: string;
    isClosed: boolean;
    onClose: () => void;
}) {
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

    return (
        <section className="stock-closure" aria-labelledby="stock-closure-title">
            <h2 id="stock-closure-title">Récapitulatif du stock</h2>
            <DataTable
                className="treatment-journal-table"
                headers={["Référence", "Lot", "Date entrée", "Quantité initiale", "Quantité restante", "Action"]}
                rows={[ [
                    lotStockageId,
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
                ] ]}
            />

            {!isClosed && <p className="helper-text">Les informations du stock seront renseignées après connexion aux données de production.</p>}
            {isClosed && <p className="helper-text" role="status">Stock clôturé dans cette interface. Cette modification n'est pas enregistrée par une API.</p>}

            {isConfirmationOpen && (
                <div className="stock-confirmation-backdrop">
                    <section
                        className="stock-confirmation-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="confirm-stock-closure-title"
                        aria-describedby="confirm-stock-closure-description"
                    >
                        <h3 id="confirm-stock-closure-title">Confirmer la clôture</h3>
                        <p id="confirm-stock-closure-description">
                            Voulez-vous clôturer le stock {lotStockageId} ? Le statut sera modifié dans cette interface uniquement.
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