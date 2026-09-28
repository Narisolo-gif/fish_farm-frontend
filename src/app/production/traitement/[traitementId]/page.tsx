import { TraitementDetail } from "@/app/features/production/traitement/components/TraitementDetail";

export default async function TraitementDetailsPage({
	params,
}: {
	params: Promise<{ traitementId: string }>;
}) {
	const { traitementId } = await params;

	return <TraitementDetail traitementId={traitementId} />;
}
