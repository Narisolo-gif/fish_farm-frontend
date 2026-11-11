import { BassinDetail } from "@/app/features/production/shared/bassins/components/BassinDetail";

export default async function BassinDetailPage({
	params,
}: {
	params: Promise<{ bassinId: string }>;
}) {
	const { bassinId } = await params;

	return <BassinDetail bassinId={bassinId} />;
}
