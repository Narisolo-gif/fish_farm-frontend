"use client";

import { useState } from "react";
import { Button, SectionHeading } from "@/components/ui";
import { DataTable } from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";
import { usePagination } from "@/app/hooks/usePagination";

const rowsPerPage = 5;

const environmentalParameters = [
	{ name: "Température de l'eau", value: "— °C" },
	{ name: "Température de l'air", value: "— °C" },
	{ name: "Taux d'oxygène", value: "— mg/L" },
	{ name: "Taux de nitrites", value: "— mg/L" },
	{ name: "Taux de nitrates", value: "— mg/L" },
];

const demoBasinPlan = ["B-01", "B-02", "B-03", "B-04", "B-05", "B-06", "B-07", "B-08"].map(
	(reference) => ({
		reference,
		species: "—",
		startedAt: "—",
		males: "—",
		females: "—",
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
	const filteredPlan = selectedBasin === "all"
		? demoBasinPlan
		: demoBasinPlan.filter((basin) => basin.reference === selectedBasin);
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
			<div className="reproduction-toolbar">
				<label className="reproduction-control">
					<span>Bassin / Hapa</span>
					<select
						value={selectedBasin}
						onChange={(event) => setSelectedBasin(event.target.value)}
					>
						<option value="all">Tous les bassins</option>
						{demoBasinPlan.map((basin) => (
							<option value={basin.reference} key={basin.reference}>
								{basin.reference}
							</option>
						))}
					</select>
				</label>
			</div>

			<section className="reproduction-section" id="environment">
				<SectionHeading title={`Paramètres environnementaux · ${selectedBasin === "all" ? "Tous les bassins" : selectedBasin}`} />
				<DataTable
					className="reproduction-table"
					headers={["Paramètre", "Valeur actuelle", "Statut"]}
					rows={environmentalParameters.map((parameter) => [
						parameter.name,
						parameter.value,
						<span className="badge" key={`${parameter.name}-status`}>Non renseigné</span>,
					])}
				/>
			</section>

			<section className="reproduction-section" id="basin-plan">
				<div className="reproduction-section-heading">
					<SectionHeading title="Plan des bassins de reproduction actifs" />
					<p className="reproduction-data-note">Données d'exemple à connecter à l'API.</p>
				</div>
				<DataTable
					className="reproduction-table"
					headers={["N° bassin", "Espèce", "Date de mise en reproduction", "Qté mâles", "Qté femelles"]}
					rows={visiblePlan.map((basin) => [
						<strong key={`${basin.reference}-reference`}>{basin.reference}</strong>,
						basin.species,
						basin.startedAt,
						basin.males,
						basin.females,
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
			</section>

			<nav className="reproduction-actions" aria-label="Actions de reproduction">
				<Button variant="ghost" href="#environment">+ Paramètre environnemental</Button>
				<Button variant="ghost" href="/bassins/new">Configurer bassin / hapa</Button>
				<button className="button button-ghost" type="button" disabled title="Le formulaire de lot n'est pas encore disponible.">
					+ Lot de reproduction
				</button>
				<button className="button button-primary" type="button" disabled title="Le formulaire de ponte n'est pas encore disponible.">
					Enregistrer une ponte
				</button>
			</nav>
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