"use client";

import { useEffect, useMemo, useState } from "react";
import { SectionHeading } from "@/components/ui";
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

export function EnvironmentalParametersSection({
	className = "ecloserie-section",
	basinCategory,
	initialFormOpen = false,
	onCancel,
}: {
	className?: string;
	basinCategory?: EnvironmentalBasin["categorie"];
	initialFormOpen?: boolean;
	onCancel?: () => void;
}) {
	const [accessToken, setAccessToken] = useState<string | null>(null);
	const [basins, setBasins] = useState<EnvironmentalBasin[]>([]);
	const [measurements, setMeasurements] = useState<EnvironmentalMeasurement[]>([]);
	const [selectedBasinId, setSelectedBasinId] = useState("all");
	const [isFormOpen, setIsFormOpen] = useState(initialFormOpen);
	const [isLoadingMeasurements, setIsLoadingMeasurements] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [reloadVersion, setReloadVersion] = useState(0);
	const [authError, setAuthError] = useState("");
	const [basinsError, setBasinsError] = useState("");
	const [measurementsError, setMeasurementsError] = useState("");
	const [submitError, setSubmitError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");

	const activeBasins = useMemo(
		() => basins.filter(
			(basin) =>
				basin.statut === "ACTIF" &&
				(!basinCategory || basin.categorie === basinCategory),
		),
		[basinCategory, basins],
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
			setIsLoadingMeasurements(true);
			setMeasurementsError("");

			try {
				const endpoint = selectedBasinId === "all"
					? "/api/v1/environnement/latest/"
					: `/api/v1/environnement/?bassin=${encodeURIComponent(selectedBasinId)}`;
				const response = await apiRequest<ApiListResponse<EnvironmentalMeasurement>>(
					endpoint,
					{ headers: { Authorization: `Bearer ${accessToken}` } },
				);

				if (isActive) {
					const results = getApiResults(response);
					const filteredResults = basinCategory
						? results.filter((measurement) =>
								activeBasins.some((basin) => basin.id === measurement.bassin),
							)
						: results;
					setMeasurements(selectedBasinId === "all" ? filteredResults : filteredResults.slice(0, 1));
				}
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
	}, [accessToken, activeBasins, basinCategory, reloadVersion, selectedBasinId]);

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
			setSelectedBasinId(String(measurement.bassin));
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

	return (
		<section id="environment" className={className} aria-label="Paramètres environnementaux">
			<SectionHeading
				title="Paramètres environnementaux"
				action={(
					<button
						className="button button-primary"
						type="button"
						aria-expanded={isFormOpen}
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

			{isFormOpen && (
				<EnvironnementParametersForm
					basins={activeBasins}
					initialBasinId={selectedBasinId}
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
			) : measurements.length > 0 ? (
				<EnvironmentalParametersTable measurements={measurements} basins={basins} />
			) : !measurementsError ? (
				<p className="list-empty-state">Aucun prélèvement environnemental enregistré pour ce filtre.</p>
			) : null}
		</section>
	);
}
