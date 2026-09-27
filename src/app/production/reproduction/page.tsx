import { PageHeader } from "@/components/PageHeader";
import { ReproductionDashboard } from "@/app/features/production/reproduction/components/ReproductionDashboard";

export default function ReproductionPage() {
	return (
		<div className="page reproduction-page">
			<PageHeader
				eyebrow="PRODUCTION · REPRODUCTION"
				title="Reproduction — Vue d'ensemble"
				description="Suivi des bassins, paramètres environnementaux et pontes."
			/>
			<ReproductionDashboard />
		</div>
	);
}
