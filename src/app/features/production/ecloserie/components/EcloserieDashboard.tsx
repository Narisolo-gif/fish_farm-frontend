import { DataTable } from "@/components/DataTable";
import { Button, SectionHeading, StatCard } from "@/components/ui";
import { EnvironmentalParametersTable } from "@/app/features/production/shared/environnement/components/EnvironmentalParametersTable";

export function EcloserieDashboard() {
	return (
		<div className="ecloserie-dashboard">
			<section className="stats-grid two" aria-label="Indicateurs d'écloserie">
				<StatCard label="Femelles ayant pondu" value="—" detail="Données à connecter à l'API" />
				<StatCard label="Quantité d'œufs éclos" value="—" detail="Données à connecter à l'API" />
			</section>

			<section className="ecloserie-section" id="environment">
				<SectionHeading title="Paramètres environnementaux" />
				<EnvironmentalParametersTable />
				<p className="ecloserie-data-note">Les relevés environnementaux seront affichés après leur connexion à l'API.</p>
			</section>

			<section className="ecloserie-section" id="hatching-history">
				<SectionHeading title="Historique des éclosions" />
				<DataTable
					className="ecloserie-table"
					headers={["Référence", "Référence ponte", "Date de ponte", "Date d'éclosion", "Quantité d'alevins obtenus"]}
					rows={[]}
				/>
				<p className="list-empty-state">Aucune éclosion enregistrée pour le moment.</p>
			</section>

			<nav className="ecloserie-actions" aria-label="Actions d'écloserie">
				<Button variant="ghost" href="/environnement/new">+ Ajouter un paramètre environnemental</Button>
				<Button variant="ghost" href="/bassins/new">Configurer bassin / hapa</Button>
				<button
					className="button button-primary"
					type="button"
					disabled
					title="Le formulaire d'éclosion n'est pas encore disponible."
				>
					Enregistrer une éclosion
				</button>
			</nav>
		</div>
	);
}
