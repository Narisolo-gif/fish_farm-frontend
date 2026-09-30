import { StockDetail } from "@/app/features/production/stocks/components/StockDetails";

export default async function StockDetailsPage({
    params,
}: {
    params: Promise<{ lotStockageId: string }>;
}) {
    const { lotStockageId } = await params;

    return <StockDetail lotStockageId={lotStockageId} />;
}
