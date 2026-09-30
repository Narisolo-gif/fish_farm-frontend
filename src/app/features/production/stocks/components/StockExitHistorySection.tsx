"use client";

import { FormEvent, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { ListSearch } from "@/components/ListSearch";
import { Pagination } from "@/components/Pagination";
import { SectionHeading } from "@/components/ui";
import { usePagination } from "@/app/hooks/usePagination";

type ExitReason = "vente" | "grossissement";

type StockExit = {
    id: string;
    lotReference: string;
    exitDate: string;
    quantityExited: number;
    quantityRemaining: number;
    reason: ExitReason;
};

const rowsPerPage = 5;

export function StockExitHistorySection() {
    const [entries, setEntries] = useState<StockExit[]>([]);
    const [search, setSearch] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [lotReference, setLotReference] = useState("");
    const [exitDate, setExitDate] = useState("");
    const [quantityExited, setQuantityExited] = useState("");
    const [quantityRemaining, setQuantityRemaining] = useState("");
    const [reason, setReason] = useState<ExitReason>("vente");

    const normalizedSearch = search.trim().toLocaleLowerCase("fr");
    const filteredEntries = entries.filter((entry) =>
        [entry.lotReference, entry.exitDate, entry.reason]
            .some((value) => value.toLocaleLowerCase("fr").includes(normalizedSearch)),
    );
    const {
        items: visibleEntries,
        currentPage,
        totalPages,
        goToPage,
        startItem,
        endItem,
    } = usePagination(filteredEntries, rowsPerPage);

    function resetForm() {
        setLotReference("");
        setExitDate("");
        setQuantityExited("");
        setQuantityRemaining("");
        setReason("vente");
    }

    function cancelForm() {
        resetForm();
        setIsFormOpen(false);
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setEntries((currentEntries) => [
            {
                id: crypto.randomUUID(),
                lotReference: lotReference.trim(),
                exitDate,
                quantityExited: Number(quantityExited),
                quantityRemaining: Number(quantityRemaining),
                reason,
            },
            ...currentEntries,
        ]);
        resetForm();
        setIsFormOpen(false);
    }

    return (
        <section className="ecloserie-section" aria-label="Historique de sortie">
            <SectionHeading
                title="Historique de sortie"
                action={(
                    <button
                        className="button button-primary"
                        type="button"
                        aria-expanded={isFormOpen}
                        onClick={() => isFormOpen ? cancelForm() : setIsFormOpen(true)}
                    >
                        {isFormOpen ? "Annuler" : "Créer une sortie"}
                    </button>
                )}
            />

            <div className="list-toolbar">
                <ListSearch
                    value={search}
                    onChange={setSearch}
                    placeholder="Référence, date ou motif"
                    label="Filtrer l'historique des sorties"
                />
            </div>

            {isFormOpen && (
                <form className="form-card wide treatment-record-form" onSubmit={handleSubmit}>
                    <h3>Nouvelle sortie</h3>
                    <div className="form-grid">
                        <label>
                            Référence lot
                            <input
                                value={lotReference}
                                onChange={(event) => setLotReference(event.target.value)}
                                required
                            />
                        </label>
                        <label>
                            Date de sortie
                            <input
                                type="date"
                                value={exitDate}
                                onChange={(event) => setExitDate(event.target.value)}
                                required
                            />
                        </label>
                        <label>
                            Quantité sortie
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={quantityExited}
                                onChange={(event) => setQuantityExited(event.target.value)}
                                required
                            />
                        </label>
                        <label>
                            Quantité restante
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={quantityRemaining}
                                onChange={(event) => setQuantityRemaining(event.target.value)}
                                required
                            />
                        </label>
                        <label>
                            Motif
                            <select value={reason} onChange={(event) => setReason(event.target.value as ExitReason)}>
                                <option value="vente">Vente</option>
                                <option value="grossissement">Grossissement</option>
                            </select>
                        </label>
                    </div>
                    <p className="helper-text">Cette saisie est locale et ne sera pas conservée après rechargement.</p>
                    <div className="form-actions">
                        <button className="button button-ghost" type="button" onClick={cancelForm}>
                            Annuler
                        </button>
                        <button className="button button-primary" type="submit">Enregistrer la sortie</button>
                    </div>
                </form>
            )}

            <DataTable
                className="ecloserie-table"
                headers={["Référence lot", "Date de sortie", "Quantité sortie", "Quantité restante", "Motif"]}
                rows={visibleEntries.map((entry) => [
                    entry.lotReference,
                    new Date(`${entry.exitDate}T00:00:00`).toLocaleDateString("fr-FR"),
                    String(entry.quantityExited),
                    String(entry.quantityRemaining),
                    entry.reason === "vente" ? "Vente" : "Grossissement",
                ])}
            />

            {filteredEntries.length === 0 && (
                <p className="list-empty-state">
                    {entries.length === 0 ? "Aucune sortie enregistrée." : "Aucune sortie ne correspond au filtre."}
                </p>
            )}

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredEntries.length}
                startItem={startItem}
                endItem={endItem}
                onPageChange={goToPage}
            />
        </section>
    );
}