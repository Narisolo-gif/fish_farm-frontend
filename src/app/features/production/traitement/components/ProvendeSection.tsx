"use client";

import { useState } from "react";
import { Pagination } from "@/components/Pagination";
import { usePagination } from "@/app/hooks/usePagination";
import { ConsommationProvendeForm, type NewConsommationProvende } from "@/app/features/production/shared/provende-ui/components/ConsommationProvendeForm";
import { ConsommationProvendeTable } from "@/app/features/production/shared/provende-ui/components/ConsommationProvendeTable";
import type { ConsommationProvendeEntry } from "@/app/features/production/shared/provende-ui/types/provende.types";

const rowsPerPage = 5;

export function ProvendeSection() {
	const [entries, setEntries] = useState<ConsommationProvendeEntry[]>([]);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const {
		items: visibleEntries,
		currentPage,
		totalPages,
		goToPage,
		startItem,
		endItem,
	} = usePagination(entries, rowsPerPage);

	function addEntry(entry: NewConsommationProvende) {
		setEntries((currentEntries) => [
			...currentEntries,
			{ ...entry, id: crypto.randomUUID() },
		]);
		setIsFormOpen(false);
	}

	return (
		<section className="treatment-mortality" aria-labelledby="consommation-heading">
			<div className="treatment-mortality-heading">
				<h2 id="consommation-heading">Journal de consommation de provende</h2>
				<button
					className="button button-primary"
					type="button"
					onClick={() => setIsFormOpen((isOpen) => !isOpen)}
					aria-expanded={isFormOpen}
				>
					{isFormOpen ? "Annuler" : "+ Consommation"}
				</button>
			</div>

			{isFormOpen && (
				<ConsommationProvendeForm
					onCancel={() => setIsFormOpen(false)}
					onSubmit={addEntry}
				/>
			)}

			{entries.length === 0 ? (
				<>
					<ConsommationProvendeTable entries={[]} />
					<p className="list-empty-state">Aucune consommation enregistrée.</p>
				</>
			) : (
				<>
					<ConsommationProvendeTable entries={visibleEntries} />
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalItems={entries.length}
						startItem={startItem}
						endItem={endItem}
						onPageChange={goToPage}
					/>
				</>
			)}
		</section>
	);
}