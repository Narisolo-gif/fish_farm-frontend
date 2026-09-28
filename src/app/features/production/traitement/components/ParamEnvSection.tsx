import { SectionHeading } from "@/components/ui";
import { EnvironmentalParametersTable } from "@/app/features/production/shared/environnement/components/EnvironmentalParametersTable";

export function ParamEnvSection() {
	return (
		<section className="ecloserie-section" aria-label="Paramètres environnementaux">
			<SectionHeading
				title="Paramètres environnementaux"
				action={(
					<button className="button button-primary" type="button">
						Mise à jour paramètre
					</button>
				)}
			/>
			<EnvironmentalParametersTable />
			<p className="ecloserie-data-note">Les relevés environnementaux seront affichés après leur connexion à l'API.</p>
		</section>
	);
}
