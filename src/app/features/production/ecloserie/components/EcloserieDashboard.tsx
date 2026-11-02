"use client";

import { DataTable } from "@/components/DataTable";
import { Button, SectionHeading, StatCard } from "@/components/ui";
import { EnvironmentalParametersSection } from "@/app/features/production/shared/environnement/components/EnvironmentalParametersSection";
import { isEclosionRecord } from "@/app/features/production/ecloserie/data/ecloserieData";
import { productionStorageKeys, useLocalRecords } from "@/app/features/production/shared/data/localProductionRecords";

export function EcloserieDashboard() {
	const eclosionsSnapshot = useLocalRecords(productionStorageKeys.eclosions, isEclosionRecord);
	const eclosions = eclosionsSnapshot.records;

	return (
		<div className="ecloserie-dashboard">
			<section className="stats-grid two" aria-label="Indicateurs d'écloserie">
				<StatCard label="Femelles ayant pondu" value="—" detail="Données à connecter à l'API" />
				<StatCard label="Quantité d'œufs éclos" value="—" detail="Données à connecter à l'API" />
			</section>

			<EnvironmentalParametersSection basinCategory="ECLOSERIE" />

			<section className="ecloserie-section" id="hatching-history">
				<SectionHeading title="Historique des éclosions" />
				{eclosionsSnapshot.error ? (
					<p className="form-error" role="alert">{eclosionsSnapshot.error}</p>
				) : eclosions.length > 0 ? (
					<DataTable
						className="ecloserie-table"
						headers={["Référence", "Référence ponte", "Date d’éclosion", "Quantité d’alevins obtenus", "Quantité d’œufs éclos", "Observation"]}
						rows={eclosions.map((eclosion) => [
							<strong key={`${eclosion.reference}-reference`}>{eclosion.reference}</strong>,
							eclosion.ponteReference,
							new Date(`${eclosion.hatchingDate}T00:00:00`).toLocaleDateString("fr-FR"),
							eclosion.fryQuantity.toLocaleString("fr-FR"),
							eclosion.hatchedEggQuantity?.toLocaleString("fr-FR") ?? "—",
							eclosion.observation || "—",
						])}
					/>
				) : (
					<p className="list-empty-state">
						{eclosionsSnapshot.isReady ? "Aucune éclosion enregistrée pour le moment." : "Chargement de l'historique…"}
					</p>
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
