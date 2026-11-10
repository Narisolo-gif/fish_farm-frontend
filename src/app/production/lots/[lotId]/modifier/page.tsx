import { Breadcrumb, PageHeader } from "@/components/PageHeader";
import { LotForm } from "@/app/features/production/lots/components/LotForm";

export default async function EditLotPage({
	params,
}: {
	params: Promise<{ lotId: string }>;
}) {
	const { lotId } = await params;

	return (
		<div className="page">
			<Breadcrumb items={["Production", "Lots", "Modifier le lot"]} />
			<PageHeader
				eyebrow="PRODUCTION · LOTS"
				title="Modifier un lot"
				description="Seuls la référence, la date de création et les observations sont modifiables."
			/>
			<LotForm mode="edit" lotId={lotId} />
		</div>
	);
}
