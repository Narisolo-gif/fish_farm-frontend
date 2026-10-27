import { Breadcrumb, PageHeader } from "@/components/PageHeader";
import { NewEclosionForm } from "@/app/features/production/ecloserie/components/NewEclosionForm";

export default function NewEclosionPage() {
	return (
		<div className="page">
			<Breadcrumb items={["Production", "Écloserie", "Nouvelle éclosion"]} />
			<PageHeader
				eyebrow="PRODUCTION · ÉCLOSERIE"
				title="Enregistrer une éclosion"
				description="Renseignez les résultats de l'éclosion."
			/>
			<NewEclosionForm />
		</div>
	);
}