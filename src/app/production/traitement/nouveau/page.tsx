import { Breadcrumb, PageHeader } from "@/components/PageHeader";
import { TraitementForm } from "@/app/features/production/traitement/components/TraitementForm";

export default function NewTraitementPage() {
	return (
		<div className="page">
			<Breadcrumb items={["Traitement", "Nouveau"]} />
			<PageHeader
				eyebrow="Production"
				title="Ouvrir un traitement"
				description="Associez un lot à un bassin et indiquez la date de début."
			/>
			<TraitementForm />
		</div>
	);
}
