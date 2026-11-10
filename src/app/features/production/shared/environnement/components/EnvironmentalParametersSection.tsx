"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { SectionHeading } from "@/components/ui";
import { Pagination } from "@/components/Pagination";
import { usePagination } from "@/app/hooks/usePagination";
import { apiRequest } from "@/lib/apiClient";
import { EnvironnementParametersForm } from "@/app/features/production/shared/environnement/components/EnvironnementParametersForm";
import { EnvironmentalParametersTable } from "@/app/features/production/shared/environnement/components/EnvironmentalParametersTable";
import {
	getApiResults,
	type ApiListResponse,
	type EnvironmentalBasin,
	type EnvironmentalMeasurement,
	type EnvironmentalMeasurementInput,
} from "@/app/features/production/shared/environnement/types/environment.types";

const measurementsPerPage = 5;

/**
 * Section des paramètres environnementaux.
 *
 * - Sans `basinId` : filtre interne par bassin (comportement historique).
 * - Avec `basinId` : le bassin est imposé par la page parente (`null` = aucun bassin),
 *   le filtre par bassin est remplacé par un filtre par date de prélèvement.
 */
export function EnvironmentalParametersSection({
	className = "ecloserie-section",
	basinCategory,
	basinId,
	initialFormOpen = false,
	onCancel,
}: {
	className?: string;
	basinCategory?: EnvironmentalBasin["categorie"];
	basinId?: number | null;
	initialFormOpen?: boolean;
	onCancel?: () => void;
}) {
	const isBasinControlled = basinId !== undefined;
	const dateFilterId = useId();
	const [accessToken, setAccessToken] = useState<string | null>(null);
	const [basins, setBasins] = useState<EnvironmentalBasin[]>([]);
	const [measurements, setMeasurements] = useState<EnvironmentalMeasurement[]>([]);
	const [selectedBasinId, setSelectedBasinId] = useState("all");
	const [selectedDate, setSelectedDate] = useState("");
	const [isFormOpen, setIsFormOpen] = useState(initialFormOpen);
	const [isLoadingMeasurements, setIsLoadingMeasurements] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [reloadVersion, setReloadVersion] = useState(0);
	const [authError, setAuthError] = useState("");
	const [basinsError, setBasinsError] = useState("");
	const [measurementsError, setMeasurementsError] = useState("");
	const [submitError, setSubmitError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [lastBasinId, setLastBasinId] = useState(basinId);

	// Changement de bassin imposé par la page : on repart d'un état propre.
	if (lastBasinId !== basinId) {
		setLastBasinId(basinId);
		setSelectedDate("");
		setSuccessMessage("");
		setSubmitError("");
	}

	const activeBasins = useMemo(
		() => basins.filter(
			(basin) =>
				basin.statut === "ACTIF" &&
				(!basinCategory || basin.categorie === basinCategory),
		),
		[basinCategory, basins],
	);
	const formBasins = useMemo(
		() => isBasinControlled
			? activeBasins.filter((basin) => basin.id === basinId)
			: activeBasins,
		[activeBasins, basinId, isBasinControlled],
	);

	useEffect(() => {
		let isActive = true;

		void Promise.resolve().then(() => {
			if (!isActive) {
				return;
			}

			const token = localStorage.getItem("access_token");
			if (!token) {
				setAuthError("Votre session a expiré. Veuillez vous reconnecter.");
				setIsLoadingMeasurements(false);
				return;
			}

			setAccessToken(token);
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

		async function loadBasins() {
			try {
				const response = await apiRequest<ApiListResponse<EnvironmentalBasin>>(
					"/api/v1/bassins/",
					{ headers: { Authorization: `Bearer ${accessToken}` } },
				);

				if (isActive) {
					setBasins(getApiResults(response));
				}
			} catch (loadError) {
				if (isActive) {
					setBasinsError(
						loadError instanceof Error
							? loadError.message
							: "Impossible de charger la liste des bassins.",
					);
				}
			}
		}

		void loadBasins();

		return () => {
			isActive = false;
		};
	}, [accessToken]);

	useEffect(() => {
		if (!accessToken) {
			return;
		}

		let isActive = true;

		async function loadMeasurements() {
			if (isBasinControlled && basinId === null) {
				setMeasurements([]);
				setMeasurementsError("");
				setIsLoadingMeasurements(false);
				return;
			}

			setIsLoadingMeasurements(true);
			setMeasurementsError("");

			try {
				const endpoint = isBasinControlled
					? `/api/v1/environnement/?bassin=${encodeURIComponent(String(basinId))}`
					: selectedBasinId === "all"
						? "/api/v1/environnement/latest/"
						: `/api/v1/environnement/?bassin=${encodeURIComponent(selectedBasinId)}`;
				const response = await apiRequest<ApiListResponse<EnvironmentalMeasurement>>(
					endpoint,
					{ headers: { Authorization: `Bearer ${accessToken}` } },
				);

				if (!isActive) {
					return;
				}

				const results = getApiResults(response);
				if (isBasinControlled) {
					setMeasurements(
						[...results].sort((first, second) =>
							second.date_heure_prelevement.localeCompare(first.date_heure_prelevement),
						),
					);
					return;
				}

				const filteredResults = basinCategory
					? results.filter((measurement) =>
							activeBasins.some((basin) => basin.id === measurement.bassin),
						)
					: results;
				setMeasurements(selectedBasinId === "all" ? filteredResults : filteredResults.slice(0, 1));
			} catch (loadError) {
				if (isActive) {
					setMeasurements([]);
					setMeasurementsError(
						loadError instanceof Error
							? loadError.message
							: "Impossible de charger les paramètres environnementaux.",
					);
				}
			} finally {
				if (isActive) {
					setIsLoadingMeasurements(false);
				}
			}
		}

		void loadMeasurements();

		return () => {
			isActive = false;
		};
	}, [accessToken, activeBasins, basinCategory, basinId, isBasinControlled, reloadVersion, selectedBasinId]);

	const displayedMeasurements = isBasinControlled && selectedDate
		? measurements.filter(
				(measurement) => getLocalDate(measurement.date_heure_prelevement) === selectedDate,
			)
		: measurements;
	const {
		items: visibleMeasurements,
		currentPage,
		totalPages,
		goToPage,
		startItem,
		endItem,
	} = usePagination(displayedMeasurements, measurementsPerPage);

	async function saveMeasurement(measurement: EnvironmentalMeasurementInput) {
		if (!accessToken) {
			setSubmitError("Votre session a expiré. Veuillez vous reconnecter.");
			return;
		}

		setIsSubmitting(true);
		setSubmitError("");
		setSuccessMessage("");

		try {
			await apiRequest<EnvironmentalMeasurement>("/api/v1/environnement/", {
				method: "POST",
				headers: { Authorization: `Bearer ${accessToken}` },
				body: JSON.stringify(measurement),
			});
			if (!isBasinControlled) {
				setSelectedBasinId(String(measurement.bassin));
			}
			setIsFormOpen(false);
			setReloadVersion((version) => version + 1);
			setSuccessMessage("Le prélèvement environnemental a été enregistré.");
		} catch (saveError) {
			setSubmitError(
				saveError instanceof Error
					? saveError.message
					: "Impossible d'enregistrer le prélèvement environnemental.",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	const canAddMeasurement = formBasins.length > 0;

	return (
		<section id="environment" className={className} aria-label="Paramètres environnementaux">
			<SectionHeading
				title="Paramètres environnementaux"
				action={(
					<button
						className="button button-primary"
						type="button"
						aria-expanded={isFormOpen}
						disabled={!isFormOpen && !canAddMeasurement}
						title={!canAddMeasurement ? "Aucun bassin actif disponible pour un relevé" : undefined}
						onClick={() => {
							setSubmitError("");
							setIsFormOpen((isOpen) => !isOpen);
						}}
					>
						{isFormOpen ? "Annuler" : "Mise à jour paramètre"}
					</button>
				)}
			/>

			{authError && <p className="form-error" role="alert">{authError}</p>}
			{basinsError && <p className="form-error" role="alert">{basinsError}</p>}
			{measurementsError && <p className="form-error" role="alert">{measurementsError}</p>}
			{submitError && <p className="form-error" role="alert">{submitError}</p>}
			{successMessage && <p className="form-success" role="status">{successMessage}</p>}

			<div className="list-content">
			{isBasinControlled ? (
				<div className="list-toolbar">
					<div className="date-filter">
						<label htmlFor={dateFilterId}>Date du prélèvement</label>
						<input
							id={dateFilterId}
							type="date"
							value={selectedDate}
							max={getLocalDate(new Date().toISOString())}
							onChange={(event) => setSelectedDate(event.target.value)}
							disabled={basinId === null}
						/>
						{selectedDate && (
							<button
								className="filter-clear"
								type="button"
								onClick={() => setSelectedDate("")}
								aria-label="Effacer le filtre de date"
							>
								Effacer
							</button>
						)}
					</div>
					<span className="list-result-count" aria-live="polite">
						{displayedMeasurements.length} relevé{displayedMeasurements.length > 1 ? "s" : ""}
						{selectedDate ? ` le ${new Date(`${selectedDate}T00:00:00`).toLocaleDateString("fr-FR")}` : ""}
					</span>
				</div>
			) : (
				<label className="reproduction-control environment-basin-filter">
					<span>Filtrer par bassin</span>
					<select
						value={selectedBasinId}
						onChange={(event) => setSelectedBasinId(event.target.value)}
						disabled={activeBasins.length === 0}
					>
						<option value="all">Tous les bassins</option>
						{activeBasins.map((basin) => (
							<option key={basin.id} value={basin.id}>{basin.reference}</option>
						))}
					</select>
				</label>
			)}

			{isFormOpen && (
				<EnvironnementParametersForm
					basins={formBasins}
					initialBasinId={isBasinControlled ? String(basinId ?? "") : selectedBasinId}
					isSubmitting={isSubmitting}
					onCancel={() => {
						setIsFormOpen(false);
						onCancel?.();
					}}
					onSubmit={saveMeasurement}
				/>
			)}

			{isLoadingMeasurements ? (
				<p className="list-empty-state" role="status">Chargement des relevés environnementaux...</p>
			) : displayedMeasurements.length > 0 ? (
				<>
					<EnvironmentalParametersTable
						measurements={isBasinControlled ? visibleMeasurements : displayedMeasurements}
						basins={basins}
					/>
					{isBasinControlled && (
						<Pagination
							currentPage={currentPage}
							totalPages={totalPages}
							totalItems={displayedMeasurements.length}
							startItem={startItem}
							endItem={endItem}
							onPageChange={goToPage}
						/>
					)}
				</>
			) : !measurementsError ? (
				<p className="list-empty-state">
					{isBasinControlled && selectedDate
						? "Aucun prélèvement environnemental à cette date pour ce bassin."
						: "Aucun prélèvement environnemental enregistré pour ce filtre."}
				</p>
			) : null}
			</div>
		</section>
	);
}

function getLocalDate(isoDateTime: string) {
	const date = new Date(isoDateTime);
	return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}
