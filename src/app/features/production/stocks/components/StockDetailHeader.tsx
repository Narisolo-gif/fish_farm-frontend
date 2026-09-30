import { PageHeader } from "@/components/PageHeader";
import { StockFeatureNav } from "@/app/features/production/stocks/components/StockFeatureNav";
import type { StockSection } from "@/app/features/production/stocks/types/stock.types";

export function StockDetailHeader({
	lotStockageId,
	isClosed,
	activeFeature,
	onFeatureChange,
}: {
	lotStockageId: string;
	isClosed: boolean;
	activeFeature: StockSection;
	onFeatureChange: (feature: StockSection) => void;
}) {
	return (
		<>
			<PageHeader eyebrow="Production" title="Détail du stock" />
			<dl className="stock-meta">
				<div>
					<dt>Référence</dt>
					<dd>{lotStockageId}</dd>
				</div>
				<div>
					<dt>Lot</dt>
					<dd>—</dd>
				</div>
				<div>
					<dt>Statut</dt>
					<dd><span className={`badge${isClosed ? " badge-amber" : " badge-green"}`}>{isClosed ? "Clôturé" : "Ouvert"}</span></dd>
				</div>
			</dl>
			<StockFeatureNav activeFeature={activeFeature} onSelect={onFeatureChange} />
		</>
	);
}
