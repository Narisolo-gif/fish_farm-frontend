"use client";

import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";
import { StatCard } from "@/components/ui";
import { usePagination } from "@/app/hooks/usePagination";
import { MortaliteForm } from "@/app/features/production/traitement/components/MortaliteForm";
import type { MortaliteRecord } from "@/app/features/production/traitement/types/traitement.types";

const rowsPerPage = 5;

export function MortaliteSection() {
	const [records, setRecords] = useState<MortaliteRecord[]>([]);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const {
		items: visibleRecords,
		currentPage,
		totalPages,
		goToPage,
		startItem,
		endItem,
	} = usePagination(records, rowsPerPage);

	function addRecord(date: string, deaths: number, observation: string) {
		setRecords((currentRecords) => [
			...currentRecords,
			{ id: crypto.randomUUID(), date, deaths, observation },
		]);
		setIsFormOpen(false);
	}

	return (
		<section className="treatment-mortality" aria-labelledby="mortality-heading">
			<div className="stats-grid two treatment-mortality-stats">
				<StatCard label="Taux de mortalité" value="—" detail="Effectif initial non renseigné" />
				<StatCard label="Taux de survie" value="—" detail="Effectif initial non renseigné" />
			</div>

			<div className="treatment-mortality-heading">
				<h2 id="mortality-heading">Journal de mortalité</h2>
				<button
					className="button button-primary"
					type="button"
					onClick={() => setIsFormOpen((isOpen) => !isOpen)}
					aria-expanded={isFormOpen}
				>
					{isFormOpen ? "Annuler" : "+ Mortalité"}
				</button>
			</div>

			{isFormOpen && (
				<MortaliteForm onCancel={() => setIsFormOpen(false)} onSubmit={addRecord} />
			)}

			{records.length === 0 ? (
				<p className="list-empty-state">Aucune mortalité enregistrée.</p>
			) : (
				<>
					<DataTable
						className="treatment-journal-table"
						headers={["Date", "Nombre de morts", "Effectifs restants", "Observation"]}
						rows={visibleRecords.map((record) => [
							new Date(`${record.date}T00:00:00`).toLocaleDateString("fr-FR"),
							String(record.deaths),
							"—",
							record.observation || "—",
						])}
					/>
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalItems={records.length}
						startItem={startItem}
						endItem={endItem}
						onPageChange={goToPage}
					/>
				</>
			)}
		</section>
	);
}