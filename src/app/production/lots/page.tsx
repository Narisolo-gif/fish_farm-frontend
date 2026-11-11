"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { DataTable } from "@/components/DataTable";
import { ListSearch } from "@/components/ListSearch";
import { Pagination } from "@/components/Pagination";
import { PageHeader } from "@/components/PageHeader";
import { usePagination } from "@/app/hooks/usePagination";
import { matchesSearch } from "@/lib/search";
import { LotDetailLink } from "@/app/features/production/lots/components/LotActions";
import { getLots } from "@/app/features/production/lots/services/lotApi";
import {
	LOT_ESPECE_LABELS,
	LOT_PARCOURS_LABELS,
	getStadeBadgeClass,
	getStadeLabel,
	type LotRecord,
} from "@/app/features/production/lots/types/lot.types";

function formatDate(value: string) {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR");
}

export default function LotsPage() {
	const [lots, setLots] = useState<LotRecord[]>([]);
	const [search, setSearch] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

	const filteredLots = lots.filter((lot) =>
		matchesSearch(
			[
				lot.reference,
				lot.reference_eclosion,
				LOT_ESPECE_LABELS[lot.espece] ?? lot.espece,
				lot.quantite_initiale,
				LOT_PARCOURS_LABELS[lot.parcours_production],
				getStadeLabel(lot.stade),
				formatDate(lot.date_creation),
				lot.observations,
			],
			search,
		),
	);
	const {
		items: visibleLots,
		currentPage,
		totalPages,
		goToPage,
		startItem,
		endItem,
	} = usePagination(filteredLots, 10);

	useEffect(() => {
		let isActive = true;

		async function loadLots() {
			try {
				const history = await getLots();
				if (isActive) setLots(history);
			} catch (loadError) {
				if (isActive) {
					setError(loadError instanceof Error ? loadError.message : "Impossible de charger l'historique des lots.");
				}
			} finally {
				if (isActive) setIsLoading(false);
			}
		}

		void loadLots();
		return () => {
			isActive = false;
		};
	}, []);

	return (
		<div className="page">
			<PageHeader
				eyebrow="Production"
				title="Lots"
				description="Historique des lots issus des éclosions et suivi de leur stade."
				action={<Button href="/production/lots/new">+ Nouveau lot</Button>}
			/>
			<div className="list-content">
				{error && <p className="form-error" role="alert">{error}</p>}
				{isLoading ? (
					<p className="list-empty-state" role="status">Chargement de l&apos;historique des lots...</p>
				) : error ? null : (
					<>
						<div className="list-toolbar">
							<ListSearch
								value={search}
								onChange={(value) => {
									setSearch(value);
									goToPage(1);
								}}
								placeholder="Référence, éclosion, espèce, stade..."
								label="Rechercher dans l'historique des lots"
							/>
							<span className="list-result-count" aria-live="polite">
								{filteredLots.length} lot{filteredLots.length > 1 ? "s" : ""}
							</span>
						</div>
						<section className="ecloserie-section lots-section" aria-label="Historique des lots">
							{visibleLots.length > 0 ? (
								<DataTable
									className="ecloserie-table lots-table table-with-actions"
									headers={["Référence", "Éclosion", "Espèce", "Quantité initiale", "Parcours", "Stade", "Créé le", "Actions"]}
									rows={visibleLots.map((lot) => [
										<Link key={`${lot.id}-ref`} href={`/production/lots/${lot.id}`}>
											<strong>{lot.reference}</strong>
										</Link>,
										lot.reference_eclosion,
										LOT_ESPECE_LABELS[lot.espece] ?? lot.espece,
										lot.quantite_initiale.toLocaleString("fr-FR"),
										LOT_PARCOURS_LABELS[lot.parcours_production] ?? lot.parcours_production,
										<span key={`${lot.id}-stade`} className={getStadeBadgeClass(lot.stade)}>
											{getStadeLabel(lot.stade)}
										</span>,
										formatDate(lot.date_creation),
										<LotDetailLink key={`${lot.id}-actions`} lot={lot} />,
									])}
								/>
							) : (
								<p className="list-empty-state">
									{lots.length === 0
										? "Aucun lot enregistré pour le moment."
										: "Aucun lot ne correspond à la recherche."}
								</p>
							)}
							<Pagination
								currentPage={currentPage}
								totalPages={totalPages}
								totalItems={filteredLots.length}
								startItem={startItem}
								endItem={endItem}
								onPageChange={goToPage}
							/>
						</section>
					</>
				)}
			</div>
		</div>
	);
}
