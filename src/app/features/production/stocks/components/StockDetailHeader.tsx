"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StockFeatureNav } from "@/app/features/production/stocks/components/StockFeatureNav";
import {
	getStockDetail,
	type StockRecord,
} from "@/app/features/production/stocks/services/stockApi";
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
	const [stock, setStock] = useState<StockRecord | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let isActive = true;

		async function loadStock() {
			try {
				const detail = await getStockDetail(lotStockageId);
				if (isActive) {
					setStock(detail);
				}
			} catch (loadError) {
				if (isActive) {
					setError(
						loadError instanceof Error
							? loadError.message
							: "Impossible de charger les détails de la mise en stock.",
					);
				}
			} finally {
				if (isActive) {
					setIsLoading(false);
				}
			}
		}

		void loadStock();
		return () => {
			isActive = false;
		};
	}, [lotStockageId]);

	return (
		<>
			<PageHeader eyebrow="Production" title="Détail du stock" />
			{error && <p className="form-error" role="alert">{error}</p>}
			<dl className="stock-meta">
				<div>
					<dt>Référence</dt>
					<dd>{stock ? `#${stock.id}` : isLoading ? "Chargement..." : `#${lotStockageId}`}</dd>
				</div>
				<div>
					<dt>Lot</dt>
					<dd>{stock?.reference_lot ?? "—"}</dd>
				</div>
				<div>
					<dt>Statut</dt>
					<dd><span className={`badge${isClosed ? " badge-amber" : " badge-green"}`}>{isClosed ? "Clôturé" : "Ouvert"}</span></dd>
				</div>
				<div>
					<dt>Bassin</dt>
					<dd>{stock?.reference_bassin ?? "—"}</dd>
				</div>
				<div>
					<dt>Effectif entrant</dt>
					<dd>{stock ? stock.effectif_entrant.toLocaleString("fr-FR") : "—"}</dd>
				</div>
			</dl>
			<StockFeatureNav activeFeature={activeFeature} onSelect={onFeatureChange} />
		</>
	);
}
