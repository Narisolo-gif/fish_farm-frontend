"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { Button, SectionHeading, StatCard } from "@/components/ui";
import { ListSearch } from "@/components/ListSearch";
import { Pagination } from "@/components/Pagination";
import { useDebouncedValue } from "@/app/hooks/useDebouncedValue";
import { usePagination } from "@/app/hooks/usePagination";
// import { EnvironmentalParametersSection } from "@/app/features/production/shared/environnement/components/EnvironmentalParametersSection";
import {
	ReproductionBasinHeader,
	getCurrentLot,
} from "@/app/features/production/reproduction/components/ReproductionBasinHeader";
import type { ApiEclosionRecord } from "@/app/features/production/ecloserie/data/ecloserieData";
import type {
	PonteRecord,
	ReproductionRecord,
} from "@/app/features/production/reproduction/types/reproduction.types";
import type { EnvironmentalBasin } from "@/app/features/production/shared/environnement/types/environment.types";
import { apiRequest } from "@/lib/apiClient";
import { matchesSearch } from "@/lib/search";

const rowsPerPage = 10;

type ApiListResponse<T> = T[] | { results: T[] };

function getResults<T>(response: ApiListResponse<T>): T[] {
	return Array.isArray(response) ? response : response.results;
}

export function EcloserieDashboard() {
	const [basins, setBasins] = useState<EnvironmentalBasin[]>([]);
	const [reproductions, setReproductions] = useState<ReproductionRecord[]>([]);
	const [pontes, setPontes] = useState<PonteRecord[]>([]);
	const [eclosions, setEclosions] = useState<ApiEclosionRecord[]>([]);
	const [selectedBasinId, setSelectedBasinId] = useState<number | null>(null);
	const [isLoadingHistory, setIsLoadingHistory] = useState(true);
	const [historyError, setHistoryError] = useState("");
	const [historySearch, setHistorySearch] = useState("");
	const debouncedHistorySearch = useDebouncedValue(historySearch);

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
				const headers = { Authorization: `Bearer ${accessToken}` };
				const [basinsResponse, reproductionsResponse, pontesResponse, eclosionsResponse] = await Promise.all([
					apiRequest<ApiListResponse<EnvironmentalBasin>>("/api/v1/bassins/?categorie=REPRODUCTION", { headers }),
					apiRequest<ApiListResponse<ReproductionRecord>>("/api/v1/reproduction/reproductions/", { headers }),
					apiRequest<ApiListResponse<PonteRecord>>("/api/v1/reproduction/pontes/", { headers }),
					apiRequest<ApiListResponse<ApiEclosionRecord>>("/api/v1/ecloserie/", { headers }),
				]);
				if (isActive) {
					const loadedBasins = getResults(basinsResponse);
					setBasins(loadedBasins);
					setReproductions(getResults(reproductionsResponse));
					setPontes(getResults(pontesResponse));
					setEclosions(getResults(eclosionsResponse));
					// Bassins triés par date de création décroissante : le plus récent par défaut.
					setSelectedBasinId(loadedBasins[0]?.id ?? null);
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

	// Une éclosion est rattachée à une ponte, elle-même rattachée à un lot de reproduction
	// placé dans un bassin : c'est ce bassin qui sert de filtre.
	const basinIdByPonteReference = useMemo(() => {
		const reproductionBasin = new Map(reproductions.map((reproduction) => [reproduction.id, reproduction.bassin]));
		return new Map(pontes.map((ponte) => [ponte.reference, reproductionBasin.get(ponte.reproduction)]));
	}, [pontes, reproductions]);
	const basinReproductions = reproductions.filter((reproduction) => reproduction.bassin === selectedBasinId);
	const currentLot = getCurrentLot(basinReproductions);
	const basinEclosions = eclosions.filter(
		(eclosion) => basinIdByPonteReference.get(eclosion.reference_ponte) === selectedBasinId,
	);
	const filteredEclosions = basinEclosions.filter((eclosion) =>
		matchesSearch(
			[
				eclosion.reference,
				eclosion.reference_ponte,
				eclosion.date_eclosion,
				new Date(`${eclosion.date_eclosion}T00:00:00`).toLocaleDateString("fr-FR"),
				eclosion.quantite_alevins_obtenu,
				eclosion.quantite_oeufs_eclos === null ? "" : Number(eclosion.quantite_oeufs_eclos),
				eclosion.observation,
			],
			debouncedHistorySearch,
		),
	);
	const {
		items: visibleEclosions,
		currentPage,
		totalPages,
		goToPage,
		startItem,
		endItem,
	} = usePagination(filteredEclosions, rowsPerPage);
	const basinReference = basins.find((basin) => basin.id === selectedBasinId)?.reference ?? "";

	return (
		<div className="ecloserie-dashboard">
			<ReproductionBasinHeader
				basins={basins}
				selectedBasinId={selectedBasinId}
				currentLot={currentLot}
				isLoading={isLoadingHistory}
				onSelectBasin={(basinId) => {
					setSelectedBasinId(basinId);
					setHistorySearch("");
				}}
			/>

			<section className="stats-grid two" aria-label="Indicateurs d'écloserie">
				<StatCard label="Femelles ayant pondu" value="—" detail="Données à connecter à l'API" />
				<StatCard label="Quantité d'œufs éclos" value="—" detail="Données à connecter à l'API" />
			</section>

			{/* <EnvironmentalParametersSection basinCategory="ECLOSERIE" /> */}

			<section className="ecloserie-section" id="hatching-history">
				<SectionHeading title="Historique des éclosions" />
				<div className="list-content">
					<div className="list-toolbar">
						<ListSearch
							value={historySearch}
							onChange={setHistorySearch}
							placeholder="Rechercher une référence, une date ou une quantité..."
							label={`Rechercher dans l'historique des éclosions du bassin ${basinReference}`}
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
							{basinEclosions.length === 0
								? "Aucune éclosion enregistrée pour ce bassin."
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
				</div>
			</section>

			<nav className="ecloserie-actions" aria-label="Actions d'écloserie">
				{/* <Button variant="ghost" href="/environnement/new">+ Ajouter un paramètre environnemental</Button> */}
				<Button variant="ghost" href="/bassins/new">Configurer bassin / hapa</Button>
				<Button variant="primary" href="/production/ecloserie/nouveau">
					Enregistrer une éclosion
				</Button>
			</nav>
		</div>
	);
}
