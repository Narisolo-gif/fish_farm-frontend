import { Breadcrumb, PageHeader } from "@/components/PageHeader";
import { LotForm } from "@/app/features/production/lots/components/LotForm";

export default async function NewLotPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { eclosion } = await searchParams;

	return (
		<div className="page">
			<Breadcrumb items={["Production", "Lots", "Nouveau lot"]} />
			<PageHeader
				eyebrow="PRODUCTION · LOTS"
				title="Créer un lot"
				description="Un lot est créé à partir d'une éclosion active ; l'espèce et la quantité initiale en sont reprises."
			/>
			<LotForm mode="create" initialEclosionId={typeof eclosion === "string" ? eclosion : undefined} />
		</div>
	);
}
