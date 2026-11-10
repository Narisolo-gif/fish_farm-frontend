import { LotDetails } from "@/app/features/production/lots/components/LotDetails";

export default async function LotDetailsPage({
	params,
}: {
	params: Promise<{ lotId: string }>;
}) {
	const { lotId } = await params;

	return <LotDetails lotId={lotId} />;
}
