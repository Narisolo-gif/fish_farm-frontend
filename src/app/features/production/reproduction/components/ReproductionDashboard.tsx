"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, SectionHeading } from "@/components/ui";
import { DataTable } from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";
import { usePagination } from "@/app/hooks/usePagination";
import { LotReproductionForm } from "@/app/features/production/reproduction/components/LotReproductionForm";
import { PonteForm } from "@/app/features/production/reproduction/components/PonteForm";
import { EnvironmentalParametersSection } from "@/app/features/production/shared/environnement/components/EnvironmentalParametersSection";
import { apiRequest } from "@/lib/apiClient";
import type { EnvironmentalBasin } from "@/app/features/production/shared/environnement/types/environment.types";
import type {
	PonteInput,
	PonteRecord,
	ReproductionInput,
	ReproductionRecord,
} from "@/app/features/production/reproduction/types/reproduction.types";

const rowsPerPage = 5;

type ApiListResponse<T> = T[] | { results: T[] };
type HistoryRange = 5 | 10;

function getResults<T>(response: ApiListResponse<T>): T[] {
	return Array.isArray(response) ? response : response.results;
}

function getErrorMessage(error: unknown, fallback: string) {
	return error instanceof Error ? error.message : fallback;
}

export function ReproductionDashboard() {
	const [accessToken, setAccessToken] = useState<string | null>(null);
	const [basins, setBasins] = useState<EnvironmentalBasin[]>([]);
	const [reproductions, setReproductions] = useState<ReproductionRecord[]>([]);
	const [pontes, setPontes] = useState<PonteRecord[]>([]);
	const [selectedBasin, setSelectedBasin] = useState("all");
	const [historyRange, setHistoryRange] = useState<HistoryRange>(5);
	const [isLotFormOpen, setIsLotFormOpen] = useState(false);
	const [isPonteFormOpen, setIsPonteFormOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmittingLot, setIsSubmittingLot] = useState(false);
	const [isSubmittingPonte, setIsSubmittingPonte] = useState(false);
	const [reloadVersion, setReloadVersion] = useState(0);
	const [loadError, setLoadError] = useState("");
	const [lotError, setLotError] = useState("");
	const [ponteError, setPonteError] = useState("");

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
					setBasins(getResults(basinsResponse));
					setReproductions(getResults(reproductionsResponse));
					setPontes(getResults(pontesResponse));
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

	const activeReproductions = reproductions.filter((reproduction) => reproduction.statut === "ACTIF");
	const activeReproductionBasinIds = new Set(activeReproductions.map((reproduction) => reproduction.bassin));
	const availableBasins = basins.filter(
		(basin) => basin.statut === "ACTIF" && !activeReproductionBasinIds.has(basin.id),
	);
	const basinById = useMemo(
		() => new Map(basins.map((basin) => [basin.id, basin])),
		[basins],
	);
	const reproductionById = useMemo(
		() => new Map(reproductions.map((reproduction) => [reproduction.id, reproduction])),
		[reproductions],
	);
	const filteredReproductions = reproductions.filter(
		(reproduction) => selectedBasin === "all" || String(reproduction.bassin) === selectedBasin,
	);
	const {
		items: visibleReproductions,
		currentPage,
		totalPages,
		goToPage,
		startItem,
		endItem,
	} = usePagination(filteredReproductions, rowsPerPage);
	const historyPontes = pontes
		.filter((ponte) => {
			if (selectedBasin === "all") {
				return true;
			}
			return String(reproductionById.get(ponte.reproduction)?.bassin) === selectedBasin;
		})
		.sort((first, second) =>
			first.date_ponte.localeCompare(second.date_ponte) || first.id - second.id,
		)
		.slice(-historyRange);
	const basinReferences = Object.fromEntries(
		basins.map((basin) => [basin.id, basin.reference]),
	);

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
			setSelectedBasin(String(reproduction.bassin));
			setReloadVersion((version) => version + 1);
		} catch (error) {
			setLotError(getErrorMessage(error, "Impossible d'ajouter la reproduction."));
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
			setSelectedBasin(String(ponte.bassin));
			setReloadVersion((version) => version + 1);
		} catch (error) {
			setPonteError(getErrorMessage(error, "Impossible d'enregistrer la ponte."));
		} finally {
			setIsSubmittingPonte(false);
		}
	}

	return (
		<div className="reproduction-dashboard">
			{loadError && <p className="form-error" role="alert">{loadError}</p>}

			{isLotFormOpen ? (
				<LotReproductionForm
					basins={availableBasins}
					isSubmitting={isSubmittingLot}
					error={lotError}
					onCancel={() => {
						setLotError("");
						setIsLotFormOpen(false);
					}}
					onSubmit={(reproduction) => void createReproduction(reproduction)}
				/>
			) : isPonteFormOpen ? (
				<PonteForm
					reproductions={activeReproductions}
					basinReferences={basinReferences}
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
					<EnvironmentalParametersSection
						className="reproduction-section"
						basinCategory="REPRODUCTION"
					/>

					<section className="reproduction-section" id="basin-plan">
						<div className="reproduction-section-heading">
							<SectionHeading title="Historique des lots de reproduction" />
							<label className="reproduction-control">
								<span>Filtrer par bassin</span>
								<select
									value={selectedBasin}
									onChange={(event) => setSelectedBasin(event.target.value)}
								>
									<option value="all">Tous les bassins</option>
									{basins.map((basin) => (
										<option value={basin.id} key={basin.id}>{basin.reference}</option>
									))}
								</select>
							</label>
						</div>
						{isLoading ? (
							<p className="list-empty-state" role="status">Chargement des reproductions...</p>
						) : filteredReproductions.length > 0 ? (
							<DataTable
								className="reproduction-table"
								headers={["Référence", "Bassin", "Espèce", "Date d'ajout", "Qté mâles", "Qté femelles", "Statut"]}
								rows={visibleReproductions.map((reproduction) => [
									<strong key={`${reproduction.id}-reference`}>{reproduction.reference}</strong>,
									basinById.get(reproduction.bassin)?.reference ?? "—",
									reproduction.espece === "CARPE" ? "Carpe" : "Tilapia",
									new Date(`${reproduction.date_ajout}T00:00:00`).toLocaleDateString("fr-FR"),
									reproduction.quantite_male.toLocaleString("fr-FR"),
									reproduction.quantite_femelle.toLocaleString("fr-FR"),
									reproduction.statut === "ACTIF" ? "Actif" : "Inactif",
								])}
							/>
						) : !loadError ? (
							<p className="list-empty-state">Aucune reproduction enregistrée pour ce bassin.</p>
						) : null}
						<Pagination
							currentPage={currentPage}
							totalPages={totalPages}
							totalItems={filteredReproductions.length}
							startItem={startItem}
							endItem={endItem}
							onPageChange={goToPage}
						/>
					</section>

					<section className="reproduction-section" id="egg-history">
						<div className="reproduction-section-heading">
							<SectionHeading title={`Historique des pontes · ${historyRange} dernières pontes`} />
							<label className="reproduction-control reproduction-period-control">
								<span>Période</span>
								<select
									value={historyRange}
									onChange={(event) => setHistoryRange(Number(event.target.value) as HistoryRange)}
								>
									<option value={5}>5 pontes</option>
									<option value={10}>10 pontes</option>
								</select>
							</label>
						</div>
						{isLoading ? (
							<p className="list-empty-state" role="status">Chargement de l&apos;historique des pontes...</p>
						) : historyPontes.length > 0 ? (
							<>
								<EggHistoryChart pontes={historyPontes} />
								<DataTable
									className="reproduction-table"
									headers={["Référence ponte", "Reproduction", "Bassin", "Date de ponte", "Quantité d'œufs obtenus", "Observation"]}
									rows={[...historyPontes].reverse().map((ponte) => {
										const reproduction = reproductionById.get(ponte.reproduction);
										return [
											<strong key={`${ponte.id}-reference`}>{ponte.reference}</strong>,
											reproduction?.reference ?? "—",
											reproduction ? basinById.get(reproduction.bassin)?.reference ?? "—" : "—",
											new Date(`${ponte.date_ponte}T00:00:00`).toLocaleDateString("fr-FR"),
											Number(ponte.quantite_oeuf_obtenu).toLocaleString("fr-FR"),
											ponte.observation || "—",
										];
									})}
								/>
							</>
						) : !loadError ? (
							<p className="list-empty-state">Aucune ponte enregistrée pour ce bassin.</p>
						) : null}
					</section>

					<nav className="reproduction-actions" aria-label="Actions de reproduction">
						<Button variant="ghost" href="/environnement/new">+ Paramètre environnemental</Button>
						<button
							className="button button-ghost"
							type="button"
							disabled={isLoading || availableBasins.length === 0}
							onClick={() => {
								setLotError("");
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

function EggHistoryChart({ pontes }: { pontes: PonteRecord[] }) {
	const values = pontes.map((ponte) => Number(ponte.quantite_oeuf_obtenu));
	const maximum = Math.max(...values, 1);
	const points = values.map((value, index) => ({
		x: 36 + (index * 588) / Math.max(values.length - 1, 1),
		y: 132 - (value / maximum) * 96,
		date: new Date(`${pontes[index].date_ponte}T00:00:00`).toLocaleDateString("fr-FR", {
			day: "2-digit",
			month: "2-digit",
		}),
		value,
	}));
	const pointList = points.map((point) => `${point.x},${point.y}`).join(" ");

	return (
		<div className="reproduction-chart-wrap">
			<svg
				className="reproduction-chart"
				viewBox="0 0 660 172"
				role="img"
				aria-label={`Quantité d'œufs par ponte sur ${pontes.length} dernières pontes`}
				preserveAspectRatio="none"
			>
				{[24, 60, 96, 132].map((position) => (
					<line key={position} x1="32" x2="628" y1={position} y2={position} />
				))}
				<polyline points={pointList} />
				{points.map((point, index) => (
					<g key={pontes[index].id}>
						<circle cx={point.x} cy={point.y} r="3.5">
							<title>{`${point.value.toLocaleString("fr-FR")} œufs, ${point.date}`}</title>
						</circle>
						<text x={point.x} y="162" textAnchor="middle">{point.date}</text>
					</g>
				))}
			</svg>
		</div>
	);
}
