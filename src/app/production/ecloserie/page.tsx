import { PageHeader } from "@/components/PageHeader";
import { EcloserieDashboard } from "@/app/features/production/ecloserie/components/EcloserieDashboard";

export default function EcloseriePage() {
	return (
		<div className="page ecloserie-page">
			<PageHeader
				eyebrow="PRODUCTION · ÉCLOSERIE"
				title="Écloserie — Vue d'ensemble"
				description="Suivi des paramètres environnementaux, des pontes et de l'éclosion des œufs."
			/>
			<EcloserieDashboard />
		</div>
	);
}
