"use client";

import { useState } from "react";
import { Button, SectionHeading } from "@/components/ui";
import { DataTable } from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";
import { usePagination } from "@/app/hooks/usePagination";
import { LotReproductionForm } from "@/app/features/production/reproduction/components/LotReproductionForm";
import { PonteForm } from "@/app/features/production/reproduction/components/PonteForm";
import { demoReproductionBasins, isReproductionPonte, type ReproductionLot } from "@/app/features/production/reproduction/data/reproductionData";
import { EnvironmentalParametersSection } from "@/app/features/production/shared/environnement/components/EnvironmentalParametersSection";
import { productionStorageKeys, useLocalRecords, writeLocalRecords } from "@/app/features/production/shared/data/localProductionRecords";

const rowsPerPage = 5;

const demoBasinPlan = demoReproductionBasins.map(
	(basin) => ({
		reference: "—",
		basin,
		species: "—",
		startedAt: "—",
		males: "—",
		females: "—",
		status: "—",
		// observation: "—",
	}),
);

const demoEggCounts: Record<5 | 10, number[]> = {
	5: [18, 34, 33, 21, 27],
	10: [16, 20, 18, 27, 31, 25, 36, 33, 43, 38],
};

type HistoryRange = 5 | 10;

export function ReproductionDashboard() {
	const [selectedBasin, setSelectedBasin] = useState("all");
	const [historyRange, setHistoryRange] = useState<HistoryRange>(5);
	const [createdLots, setCreatedLots] = useState<ReproductionLot[]>([]);
	const pontesSnapshot = useLocalRecords(productionStorageKeys.reproductionPontes, isReproductionPonte);
	const recordedPontes = pontesSnapshot.records;
	const [pontesSaveError, setPontesSaveError] = useState("");
	const pontesStorageError = pontesSnapshot.error || pontesSaveError;
	const [isLotFormOpen, setIsLotFormOpen] = useState(false);
	const [isPonteFormOpen, setIsPonteFormOpen] = useState(false);

	const plan = [
		...demoBasinPlan,
		...createdLots.map((lot) => ({
			reference: lot.reference,
			basin: lot.basin,
			species: lot.species,
			startedAt: new Date(lot.addedAt).toLocaleString("fr-FR"),
			males: String(lot.maleQuantity),
			females: String(lot.femaleQuantity),
			status: String(lot.status),

		})),
	];
	const filteredPlan = selectedBasin === "all"
		? plan
		: plan.filter((lot) => lot.basin === selectedBasin);
	const {
		items: visiblePlan,
		currentPage,
		totalPages,
		goToPage,
		startItem,
		endItem,
	} = usePagination(filteredPlan, rowsPerPage);
	const eggCounts = demoEggCounts[historyRange];

	return (
		<div className="reproduction-dashboard">
			{pontesStorageError && <p className="form-error" role="alert">{pontesStorageError}</p>}
			{isPonteFormOpen ? (
				<PonteForm
					basins={demoReproductionBasins}
					referenceSequence={recordedPontes.length + 1}
					onCancel={() => setIsPonteFormOpen(false)}
					onSubmit={(ponte) => {
						const nextPontes = [ponte, ...recordedPontes];
						try {
							writeLocalRecords(productionStorageKeys.reproductionPontes, nextPontes);
							setPontesSaveError("");
							setIsPonteFormOpen(false);
						} catch (error) {
							setPontesSaveError(error instanceof Error ? error.message : "Impossible d'enregistrer la ponte.");
						}
					}}
				/>
			) : isLotFormOpen ? (
				<LotReproductionForm
					basins={demoReproductionBasins}
					referenceSequence={createdLots.length + 1}
					onCancel={() => setIsLotFormOpen(false)}
					onSubmit={(lot) => {
						setCreatedLots((currentLots) => [lot, ...currentLots]);
						setSelectedBasin(lot.basin);
						setIsLotFormOpen(false);
					}}
				/>
			) : (
				<>
					{/* <div className="reproduction-toolbar">
						<label className="reproduction-control">
							<span>Bassin / Hapa</span>
							<select
								value={selectedBasin}
								onChange={(event) => setSelectedBasin(event.target.value)}
							>
								<option value="all">Tous les bassins</option>
								{demoReproductionBasins.map((basin) => (
									<option value={basin} key={basin}>
										{basin}
									</option>
								))}
							</select>
						</label>
					</div> */}

					<EnvironmentalParametersSection
						className="reproduction-section"
						basinCategory="REPRODUCTION"
					/>

					<section className="reproduction-section" id="basin-plan">
						<div className="reproduction-section-heading">
							<SectionHeading title="Historique des lots de reproduction" />
							<p className="reproduction-data-note">Données d&apos;exemple à connecter à l&apos;API.</p>
						</div>
						<DataTable
							className="reproduction-table"
							headers={["Référence lot", "N° bassin", "Espèce", "Date d'ajout", "Qté mâles", "Qté femelles", "Statut"]}
							rows={visiblePlan.map((basin) => [
								<strong key={`${basin.reference}-reference`}>{basin.reference}</strong>,
								basin.basin,
								basin.species,
								basin.startedAt,
								basin.males,
								basin.females,
								basin.status
							])}
						/>
						<Pagination
							currentPage={currentPage}
							totalPages={totalPages}
							totalItems={filteredPlan.length}
							startItem={startItem}
							endItem={endItem}
							onPageChange={goToPage}
						/>
					</section>

					<section className="reproduction-section" id="egg-history">
						<div className="reproduction-section-heading">
							<SectionHeading title={`Historique des pontes · ${historyRange} derniers cycles`} />
							<label className="reproduction-control reproduction-period-control">
								<span>Période</span>
								<select
									value={historyRange}
									onChange={(event) => setHistoryRange(Number(event.target.value) as HistoryRange)}
								>
									<option value={5}>5 cycles</option>
									<option value={10}>10 cycles</option>
								</select>
							</label>
						</div>
						<EggHistoryChart values={eggCounts} />
						<p className="reproduction-data-note">Courbe illustrative, en attente des données de ponte.</p>
						{recordedPontes.length > 0 && (
							<DataTable
								className="reproduction-table"
								headers={["Référence ponte", "Bassin", "Date de l'ajout", "Quantité d'œufs obtenus", "Observation"]}
								rows={recordedPontes.map((ponte) => [
									<strong key={`${ponte.reference}-reference`}>{ponte.reference}</strong>,
									ponte.basin,
									new Date(ponte.addedAt).toLocaleString("fr-FR"),
									`${ponte.eggQuantity.toLocaleString("fr-FR")} Ml`,
									ponte.observation || "—",
								])}
							/>
						)}
					</section>

					<nav className="reproduction-actions" aria-label="Actions de reproduction">
						<Button variant="ghost" href="/environnement/new">+ Paramètre environnemental</Button>
						{/* <Button variant="ghost" href="/bassins/new">Configurer bassin / hapa</Button> */}
						<button
							className="button button-ghost"
							type="button"
							onClick={() => setIsLotFormOpen(true)}
						>
							+ Ajouter un lot de reproduction
						</button>
						<button
							className="button button-primary"
							type="button"
							disabled={Boolean(pontesStorageError)}
							onClick={() => {
								setIsLotFormOpen(false);
								setIsPonteFormOpen(true);
							}}
						>
							Enregistrer une ponte
						</button>
					</nav>
				</>
			)}
		</div>
	);
}

function EggHistoryChart({ values }: { values: number[] }) {
	const minimum = Math.min(...values);
	const valueRange = Math.max(Math.max(...values) - minimum, 1);
	const points = values.map((value, index) => ({
		x: 36 + (index * 588) / Math.max(values.length - 1, 1),
		y: 132 - ((value - minimum) / valueRange) * 96,
	}));
	const pointList = points.map((point) => `${point.x},${point.y}`).join(" ");

	return (
		<div className="reproduction-chart-wrap">
			<svg
				className="reproduction-chart"
					viewBox="0 0 660 172"
					role="img"
					aria-label={`Quantité illustrative d'œufs sur ${values.length} cycles`}
					preserveAspectRatio="none"
				>
					{[24, 60, 96, 132].map((position) => (
						<line key={position} x1="32" x2="628" y1={position} y2={position} />
					))}
					<polyline points={pointList} />
					{points.map((point, index) => (
						<g key={`${point.x}-${point.y}`}>
							<circle cx={point.x} cy={point.y} r="3.5" />
							<text x={point.x} y="162" textAnchor="middle">{`Cycle ${index + 1}`}</text>
						</g>
					))}
				</svg>
			</div>
	);
}