"use client";

import { useState } from "react";
import { SectionHeading } from "@/components/ui";
import { EnvironnementParametersForm } from "@/app/features/production/shared/environnement/components/EnvironnementParametersForm";
import { EnvironmentalParametersTable } from "@/app/features/production/shared/environnement/components/EnvironmentalParametersTable";
import type { EnvironmentalMeasurement } from "@/app/features/production/shared/environnement/types/environment.types";

export function ParamEnvSection() {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [measurement, setMeasurement] = useState<EnvironmentalMeasurement | null>(null);

	return (
		<section className="ecloserie-section" aria-label="Paramètres environnementaux">
			<SectionHeading
				title="Paramètres environnementaux"
				action={(
					<button
						className="button button-primary"
						type="button"
						aria-expanded={isFormOpen}
						onClick={() => setIsFormOpen((isOpen) => !isOpen)}
					>
						{isFormOpen ? "Annuler" : "Mise à jour paramètre"}
					</button>
				)}
			/>
			{isFormOpen && (
				<EnvironnementParametersForm
					onCancel={() => setIsFormOpen(false)}
					onSubmit={(nextMeasurement) => {
						setMeasurement(nextMeasurement);
						setIsFormOpen(false);
					}}
				/>
			)}
			<EnvironmentalParametersTable measurement={measurement} />
			<p className="ecloserie-data-note">
				{measurement
					? `Dernier prélèvement : ${new Date(measurement.sampledAt).toLocaleString("fr-FR")} · ${measurement.basin}. Enregistrement local, non conservé après rechargement.`
					: "Aucun prélèvement environnemental enregistré pour le moment."}
			</p>
		</section>
	);
}
