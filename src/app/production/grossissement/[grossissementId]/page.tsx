import { GrossissementDetail } from "@/app/features/production/grossissements/components/GrossissementDetail";

export default async function GrossissementDetailPage({
  params,
}: {
  params: Promise<{ grossissementId: string }>;
}) {
  const { grossissementId } = await params;

  return <GrossissementDetail grossissementId={grossissementId} />;
}
