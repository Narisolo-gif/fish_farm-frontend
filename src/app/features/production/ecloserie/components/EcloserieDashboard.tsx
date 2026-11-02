"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { Button, SectionHeading, StatCard } from "@/components/ui";
import { ListSearch } from "@/components/ListSearch";
import { Pagination } from "@/components/Pagination";
import { useDebouncedValue } from "@/app/hooks/useDebouncedValue";
import { usePagination } from "@/app/hooks/usePagination";
import { EnvironmentalParametersSection } from "@/app/features/production/shared/environnement/components/EnvironmentalParametersSection";
import type { ApiEclosionRecord } from "@/app/features/production/ecloserie/data/ecloserieData";
import { apiRequest } from "@/lib/apiClient";

const rowsPerPage = 10;

type ApiListResponse<T> = T[] | { results: T[] };

function getResults<T>(response: ApiListResponse<T>): T[] {
	return Array.isArray(response) ? response : response.results;
}

export function EcloserieDashboard() {
	const [eclosions, setEclosions] = useState<ApiEclosionRecord[]>([]);
	const [isLoadingHistory, setIsLoadingHistory] = useState(true);
	const [historyError, setHistoryError] = useState("");
	const [historySearch, setHistorySearch] = useState("");
	const debouncedHistorySearch = useDebouncedValue(historySearch);
	const normalizedSearch = normalizeSearch(debouncedHistorySearch);
	const filteredEclosions = eclosions.filter((eclosion) => {
		const searchableValues = [
			eclosion.reference,
			eclosion.reference_ponte,
			eclosion.date_eclosion,
			new Date(`${eclosion.date_eclosion}T00:00:00`).toLocaleDateString("fr-FR"),
			eclosion.quantite_alevins_obtenu,
			eclosion.quantite_oeufs_eclos ?? "",
			eclosion.observation ?? "",
		].map((value) => normalizeSearch(String(value)));

		return searchableValues.some((value) => value.includes(normalizedSearch));
	});
	const {
		items: visibleEclosions,
		currentPage,
		totalPages,
		goToPage,
		startItem,
		endItem,
	} = usePagination(filteredEclosions, rowsPerPage);

	useEffect(() => {
		let isActive = true;

		void Promise.resolve().then(async () => {
			const accessToken = localStorage.getItem("access_token");
			if (!accessToken) {
				if (isActive) {
					setHistoryError("Votre session a expiré. Veuillez vous reconnecter.");
					setIsLoadingHistory(false);
				}
				return;
			}

			try {
				const response = await apiRequest<ApiListResponse<ApiEclosionRecord>>(
					"/api/v1/ecloserie/",
					{ headers: { Authorization: `Bearer ${accessToken}` } },
				);
				if (isActive) {
					setEclosions(getResults(response));
				}
			} catch (error) {
				if (isActive) {
					setHistoryError(
						error instanceof Error
							? error.message
							: "Impossible de charger l'historique des éclosions.",
					);
				}
			} finally {
				if (isActive) {
					setIsLoadingHistory(false);
				}
			}
		});

		return () => {
			isActive = false;
		};
	}, []);

	return (
		<div className="ecloserie-dashboard">
			<section className="stats-grid two" aria-label="Indicateurs d'écloserie">
				<StatCard label="Femelles ayant pondu" value="—" detail="Données à connecter à l'API" />
				<StatCard label="Quantité d'œufs éclos" value="—" detail="Données à connecter à l'API" />
			</section>

			<EnvironmentalParametersSection basinCategory="ECLOSERIE" />

			<section className="ecloserie-section" id="hatching-history">
				<SectionHeading title="Historique des éclosions" />
				<div className="list-toolbar">
					<ListSearch
						value={historySearch}
						onChange={setHistorySearch}
						placeholder="Rechercher une référence, une date ou une quantité..."
						label="Rechercher dans l'historique des éclosions"
					/>
					<span className="list-result-count" aria-live="polite">
						{filteredEclosions.length} éclosion{filteredEclosions.length > 1 ? "s" : ""}
					</span>
				</div>
				{historyError ? (
					<p className="form-error" role="alert">{historyError}</p>
				) : isLoadingHistory ? (
					<p className="list-empty-state" role="status">Chargement de l&apos;historique…</p>
				) : visibleEclosions.length > 0 ? (
					<DataTable
						className="ecloserie-table"
						headers={["Référence", "Référence ponte", "Date d’éclosion", "Quantité d’alevins obtenus", "Quantité d’œufs éclos", "Observation"]}
						rows={visibleEclosions.map((eclosion) => [
							<strong key={`${eclosion.id}-reference`}>{eclosion.reference}</strong>,
							eclosion.reference_ponte,
							new Date(`${eclosion.date_eclosion}T00:00:00`).toLocaleDateString("fr-FR"),
							eclosion.quantite_alevins_obtenu.toLocaleString("fr-FR"),
							eclosion.quantite_oeufs_eclos === null
								? "—"
								: Number(eclosion.quantite_oeufs_eclos).toLocaleString("fr-FR"),
							eclosion.observation || "—",
						])}
					/>
				) : (
					<p className="list-empty-state">
						{eclosions.length === 0
							? "Aucune éclosion enregistrée pour le moment."
							: "Aucune éclosion ne correspond à votre recherche."}
					</p>
				)}
				{!historyError && !isLoadingHistory && (
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalItems={filteredEclosions.length}
						startItem={startItem}
						endItem={endItem}
						onPageChange={goToPage}
					/>
				)}
			</section>

			<nav className="ecloserie-actions" aria-label="Actions d'écloserie">
				<Button variant="ghost" href="/environnement/new">+ Ajouter un paramètre environnemental</Button>
				<Button variant="ghost" href="/bassins/new">Configurer bassin / hapa</Button>
				<Button variant="primary" href="/production/ecloserie/nouveau">
					Enregistrer une éclosion
				</Button>
			</nav>
		</div>
	);
}

function normalizeSearch(value: string) {
	return value
		.trim()
		.toLocaleLowerCase("fr")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");
}
