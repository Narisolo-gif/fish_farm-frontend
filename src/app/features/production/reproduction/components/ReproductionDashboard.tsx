"use client";

import { useEffect, useMemo, useState } from "react";
import { SectionHeading } from "@/components/ui";
import { DataTable } from "@/components/DataTable";
import { ListSearch } from "@/components/ListSearch";
import { Pagination } from "@/components/Pagination";
import { usePagination } from "@/app/hooks/usePagination";
import { useDebouncedValue } from "@/app/hooks/useDebouncedValue";
import { LotReproductionForm } from "@/app/features/production/reproduction/components/LotReproductionForm";
import { PonteForm } from "@/app/features/production/reproduction/components/PonteForm";
import {
	ReproductionBasinHeader,
	getCurrentLot,
} from "@/app/features/production/reproduction/components/ReproductionBasinHeader";
import { EnvironmentalParametersSection } from "@/app/features/production/shared/environnement/components/EnvironmentalParametersSection";
import { ApiError, type ApiFieldErrors, apiRequest } from "@/lib/apiClient";
import { matchesSearch } from "@/lib/search";
import type { EnvironmentalBasin } from "@/app/features/production/shared/environnement/types/environment.types";
import type {
	PonteInput,
	PonteRecord,
	ReproductionInput,
	ReproductionRecord,
} from "@/app/features/production/reproduction/types/reproduction.types";

const rowsPerPage = 5;
const historyRange = 5;

type ApiListResponse<T> = T[] | { results: T[] };

function getResults<T>(response: ApiListResponse<T>): T[] {
	return Array.isArray(response) ? response : response.results;
}

function getErrorMessage(error: unknown, fallback: string) {
	return error instanceof Error ? error.message : fallback;
}

function formatDate(date: string) {
	return new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR");
}

function speciesLabel(species: ReproductionRecord["espece"]) {
	return species === "CARPE" ? "Carpe" : "Tilapia";
}

export function ReproductionDashboard() {
	const [accessToken, setAccessToken] = useState<string | null>(null);
	const [basins, setBasins] = useState<EnvironmentalBasin[]>([]);
	const [reproductions, setReproductions] = useState<ReproductionRecord[]>([]);
	const [pontes, setPontes] = useState<PonteRecord[]>([]);
	const [selectedBasinId, setSelectedBasinId] = useState<number | null>(null);
	const [lotSearch, setLotSearch] = useState("");
	const [ponteSearch, setPonteSearch] = useState("");
	const [isLotFormOpen, setIsLotFormOpen] = useState(false);
	const [isPonteFormOpen, setIsPonteFormOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmittingLot, setIsSubmittingLot] = useState(false);
	const [isSubmittingPonte, setIsSubmittingPonte] = useState(false);
	const [reloadVersion, setReloadVersion] = useState(0);
	const [loadError, setLoadError] = useState("");
	const [lotError, setLotError] = useState("");
	const [lotFieldErrors, setLotFieldErrors] = useState<ApiFieldErrors>({});
	const [ponteError, setPonteError] = useState("");
	const debouncedLotSearch = useDebouncedValue(lotSearch);
	const debouncedPonteSearch = useDebouncedValue(ponteSearch);

	useEffect(() => {
		let isActive = true;

		void Promise.resolve().then(() => {
			if (!isActive) {
				return;
			}

			const token = localStorage.getItem("access_token");
			if (token) {
				setAccessToken(token);
			} else {
				setLoadError("Votre session a expiré. Veuillez vous reconnecter.");
				setIsLoading(false);
			}
		});

		return () => {
			isActive = false;
		};
	}, []);

	useEffect(() => {
		if (!accessToken) {
			return;
		}

		let isActive = true;

		async function loadReproductionData() {
			setIsLoading(true);
			setLoadError("");

			try {
				const headers = { Authorization: `Bearer ${accessToken}` };
				const [basinsResponse, reproductionsResponse, pontesResponse] = await Promise.all([
					apiRequest<ApiListResponse<EnvironmentalBasin>>(
						"/api/v1/bassins/?categorie=REPRODUCTION",
						{ headers },
					),
					apiRequest<ApiListResponse<ReproductionRecord>>(
						"/api/v1/reproduction/reproductions/",
						{ headers },
					),
					apiRequest<ApiListResponse<PonteRecord>>(
						"/api/v1/reproduction/pontes/",
						{ headers },
					),
				]);

				if (isActive) {
					const loadedBasins = getResults(basinsResponse);
					setBasins(loadedBasins);
					setReproductions(getResults(reproductionsResponse));
					setPontes(getResults(pontesResponse));
					// Le backend trie les bassins par date de création décroissante :
					// le premier est le plus récent et sert de bassin par défaut.
					setSelectedBasinId((current) =>
						current !== null && loadedBasins.some((basin) => basin.id === current)
							? current
							: loadedBasins[0]?.id ?? null,
					);
				}
			} catch (error) {
				if (isActive) {
					setLoadError(getErrorMessage(error, "Impossible de charger les données de reproduction."));
				}
			} finally {
				if (isActive) {
					setIsLoading(false);
				}
			}
		}

		void loadReproductionData();

		return () => {
			isActive = false;
		};
	}, [accessToken, reloadVersion]);

	const selectedBasin = basins.find((basin) => basin.id === selectedBasinId) ?? null;
	const activeReproductions = reproductions.filter((reproduction) => reproduction.statut === "ACTIF");
	const activeReproductionBasinIds = new Set(activeReproductions.map((reproduction) => reproduction.bassin));
	const availableBasins = basins.filter(
		(basin) => basin.statut === "ACTIF" && !activeReproductionBasinIds.has(basin.id),
	);
	const reproductionById = useMemo(
		() => new Map(reproductions.map((reproduction) => [reproduction.id, reproduction])),
		[reproductions],
	);
	const basinReferences = Object.fromEntries(
		basins.map((basin) => [basin.id, basin.reference]),
	);

	// Toutes les données affichées sont celles du bassin sélectionné.
	const basinReproductions = reproductions.filter((reproduction) => reproduction.bassin === selectedBasinId);
	const basinActiveReproduction = basinReproductions.find((reproduction) => reproduction.statut === "ACTIF");
	const currentLot = getCurrentLot(basinReproductions);
	const basinPontes = pontes.filter(
		(ponte) => reproductionById.get(ponte.reproduction)?.bassin === selectedBasinId,
	);

	const filteredReproductions = basinReproductions.filter((reproduction) =>
		matchesSearch(
			[
				reproduction.reference,
				speciesLabel(reproduction.espece),
				reproduction.date_ajout,
				formatDate(reproduction.date_ajout),
				reproduction.quantite_male,
				reproduction.quantite_femelle,
				reproduction.statut === "ACTIF" ? "Actif" : "Inactif",
				reproduction.observation,
			],
			debouncedLotSearch,
		),
	);
	const {
		items: visibleReproductions,
		currentPage,
		totalPages,
		goToPage,
		startItem,
		endItem,
	} = usePagination(filteredReproductions, rowsPerPage);

	const filteredPontes = basinPontes.filter((ponte) =>
		matchesSearch(
			[
				ponte.reference,
				reproductionById.get(ponte.reproduction)?.reference,
				ponte.date_ponte,
				formatDate(ponte.date_ponte),
				Number(ponte.quantite_oeuf_obtenu),
				ponte.observation,
			],
			debouncedPonteSearch,
		),
	);
	const historyPontes = [...filteredPontes]
		.sort((first, second) =>
			first.date_ponte.localeCompare(second.date_ponte) || first.id - second.id,
		)
		.slice(-historyRange);

	function selectBasin(basinId: number | null) {
		setSelectedBasinId(basinId);
		setLotSearch("");
		setPonteSearch("");
	}

	async function createReproduction(reproduction: ReproductionInput) {
		setIsSubmittingLot(true);
		setLotError("");

		try {
			await apiRequest<ReproductionRecord>("/api/v1/reproduction/reproductions/", {
				method: "POST",
				headers: { Authorization: `Bearer ${accessToken}` },
				body: JSON.stringify(reproduction),
			});
			setIsLotFormOpen(false);
			setLotFieldErrors({});
			selectBasin(reproduction.bassin);
			setReloadVersion((version) => version + 1);
		} catch (error) {
			if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
				setLotFieldErrors(error.fieldErrors);
				setLotError(error.generalMessage);
			} else {
				setLotFieldErrors({});
				setLotError(getErrorMessage(error, "Impossible d'ajouter la reproduction."));
			}
		} finally {
			setIsSubmittingLot(false);
		}
	}

	async function createPonte(ponte: PonteInput) {
		setIsSubmittingPonte(true);
		setPonteError("");

		try {
			await apiRequest<PonteRecord>("/api/v1/reproduction/pontes/", {
				method: "POST",
				headers: { Authorization: `Bearer ${accessToken}` },
				body: JSON.stringify(ponte),
			});
			setIsPonteFormOpen(false);
			selectBasin(ponte.bassin);
			setReloadVersion((version) => version + 1);
		} catch (error) {
			setPonteError(getErrorMessage(error, "Impossible d'enregistrer la ponte."));
		} finally {
			setIsSubmittingPonte(false);
		}
	}

	const basinReference = selectedBasin?.reference ?? "";

	return (
		<div className="reproduction-dashboard">
			{loadError && <p className="form-error" role="alert">{loadError}</p>}

			{isLotFormOpen ? (
				<LotReproductionForm
					basins={availableBasins}
					defaultBasinId={selectedBasinId}
					isSubmitting={isSubmittingLot}
					error={lotError}
					fieldErrors={lotFieldErrors}
					onCancel={() => {
						setLotError("");
						setLotFieldErrors({});
						setIsLotFormOpen(false);
					}}
					onSubmit={(reproduction) => void createReproduction(reproduction)}
				/>
			) : isPonteFormOpen ? (
				<PonteForm
					reproductions={activeReproductions}
					basinReferences={basinReferences}
					defaultReproductionId={basinActiveReproduction?.id}
					isSubmitting={isSubmittingPonte}
					error={ponteError}
					onCancel={() => {
						setPonteError("");
						setIsPonteFormOpen(false);
					}}
					onSubmit={(ponte) => void createPonte(ponte)}
				/>
			) : (
				<>
					<ReproductionBasinHeader
						basins={basins}
						selectedBasinId={selectedBasinId}
						currentLot={currentLot}
						isLoading={isLoading}
						onSelectBasin={selectBasin}
					/>

					<EnvironmentalParametersSection
						className="reproduction-section"
						basinCategory="REPRODUCTION"
						basinId={selectedBasinId}
					/>

					<section className="reproduction-section" id="basin-plan" aria-label="Historique des lots de reproduction">
						<SectionHeading title="Historique des lots de reproduction" />
						<div className="list-content">
						<div className="list-toolbar">
							<ListSearch
								value={lotSearch}
								onChange={setLotSearch}
								placeholder="Référence, espèce, date, quantité, statut..."
								label={`Rechercher dans les lots de reproduction du bassin ${basinReference}`}
							/>
							<span className="list-result-count" aria-live="polite">
								{filteredReproductions.length} lot{filteredReproductions.length > 1 ? "s" : ""}
							</span>
						</div>
						{isLoading ? (
							<p className="list-empty-state" role="status">Chargement des reproductions...</p>
						) : filteredReproductions.length > 0 ? (
							<DataTable
								className="reproduction-table"
								headers={["Référence", "Espèce", "Date d'ajout", "Qté mâles", "Qté femelles", "Statut"]}
								rows={visibleReproductions.map((reproduction) => [
									<strong key={`${reproduction.id}-reference`}>{reproduction.reference}</strong>,
									speciesLabel(reproduction.espece),
									formatDate(reproduction.date_ajout),
									reproduction.quantite_male.toLocaleString("fr-FR"),
									reproduction.quantite_femelle.toLocaleString("fr-FR"),
									reproduction.statut === "ACTIF" ? "Actif" : "Inactif",
								])}
							/>
						) : !loadError ? (
							<p className="list-empty-state">
								{debouncedLotSearch.trim()
									? "Aucun lot ne correspond à cette recherche."
									: "Aucune reproduction enregistrée pour ce bassin."}
							</p>
						) : null}
						<Pagination
							currentPage={currentPage}
							totalPages={totalPages}
							totalItems={filteredReproductions.length}
							startItem={startItem}
							endItem={endItem}
							onPageChange={goToPage}
						/>
						</div>
					</section>

					<section className="reproduction-section" id="egg-history" aria-label="Historique des pontes">
						<SectionHeading title={`Historique des pontes · ${historyRange} dernières pontes`} />
						<div className="list-content">
						<div className="list-toolbar">
							<ListSearch
								value={ponteSearch}
								onChange={setPonteSearch}
								placeholder="Référence, lot, date, quantité d'œufs..."
								label={`Rechercher dans les pontes du bassin ${basinReference}`}
							/>
							<span className="list-result-count" aria-live="polite">
								{filteredPontes.length} ponte{filteredPontes.length > 1 ? "s" : ""}
							</span>
						</div>
						{isLoading ? (
							<p className="list-empty-state" role="status">Chargement de l&apos;historique des pontes...</p>
						) : historyPontes.length > 0 ? (
							<DataTable
								className="reproduction-table"
								headers={["Référence ponte", "Lot de reproduction", "Date de ponte", "Quantité d'œufs obtenus", "Observation"]}
								rows={[...historyPontes].reverse().map((ponte) => [
									<strong key={`${ponte.id}-reference`}>{ponte.reference}</strong>,
									reproductionById.get(ponte.reproduction)?.reference ?? "—",
									formatDate(ponte.date_ponte),
									Number(ponte.quantite_oeuf_obtenu).toLocaleString("fr-FR"),
									ponte.observation || "—",
								])}
							/>
						) : !loadError ? (
							<p className="list-empty-state">
								{debouncedPonteSearch.trim()
									? "Aucune ponte ne correspond à cette recherche."
									: "Aucune ponte enregistrée pour ce bassin."}
							</p>
						) : null}
						</div>
					</section>

					<nav className="reproduction-actions" aria-label="Actions de reproduction">
						<button
							className="button button-ghost"
							type="button"
							disabled={isLoading || availableBasins.length === 0}
							onClick={() => {
								setLotError("");
								setLotFieldErrors({});
								setIsPonteFormOpen(false);
								setIsLotFormOpen(true);
							}}
						>
							+ Ajouter un lot de reproduction
						</button>
						<button
							className="button button-primary"
							type="button"
							disabled={isLoading || activeReproductions.length === 0}
							onClick={() => {
								setPonteError("");
								setIsLotFormOpen(false);
								setIsPonteFormOpen(true);
							}}
						>
							Enregistrer une ponte
						</button>
					</nav>
					{!isLoading && availableBasins.length === 0 && (
						<p className="reproduction-data-note">Aucun bassin actif sans reproduction en cours n&apos;est disponible pour un nouveau lot.</p>
					)}
					{!isLoading && activeReproductions.length === 0 && (
						<p className="reproduction-data-note">Aucune reproduction active n&apos;est disponible pour enregistrer une ponte.</p>
					)}
				</>
			)}
		</div>
	);
}
