"use client";

import { useEffect, useState } from "react";
import { Button, SectionHeading } from "@/components/ui";
import { DataTable } from "@/components/DataTable";
import { DetailIconLink } from "@/components/DetailIconLink";
import { getMiseEnStockDuLot, type StockRecord } from "@/app/features/production/stocks/services/stockApi";
import type { TraitementDetailData } from "@/app/features/production/traitement/types/traitement.types";

const FINALITE_LABELS: Record<string, string> = {
	GROSSISSEMENT: "Grossissement",
	VENTE: "Vente",
};

function formatDateTime(value: string) {
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? value
		: date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

/**
 * Sortie d'un traitement = mise en stock du lot (règle backend : une seule par lot).
 * Elle enregistre une sortie par hapa de traitement (effectif final) et une entrée par hapa de stock.
 */
export function TraitementSortieHistorySection({
	traitement,
	isClosed,
}: {
	traitement: TraitementDetailData;
	/** État courant (la clôture peut avoir lieu sur la page sans recharger le détail). */
	isClosed: boolean;
}) {
	const [miseEnStock, setMiseEnStock] = useState<StockRecord | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState("");

	useEffect(() => {
		let isActive = true;
		getMiseEnStockDuLot(traitement.id_lot)
			.then((result) => {
				if (isActive) setMiseEnStock(result);
			})
			.catch((error: unknown) => {
				if (isActive) {
					setLoadError(error instanceof Error ? error.message : "Impossible de charger l'historique de sortie.");
				}
			})
			.finally(() => {
				if (isActive) setIsLoading(false);
			});
		return () => {
			isActive = false;
		};
	}, [traitement.id_lot]);

	const effectifSortant = traitement.hapas.reduce((total, hapa) => total + (hapa.effectif_final ?? 0), 0);
	const canCreate = isClosed && !isLoading && !loadError && !miseEnStock;

	return (
		<section className="ecloserie-section" aria-label="Historique de sortie">
			<SectionHeading
				title="Historique de sortie"
				action={
					canCreate ? (
						<Button href={`/production/stock/nouveau?lot=${traitement.id_lot}`}>Créer la sortie vers le stock</Button>
					) : undefined
				}
			/>

			{loadError ? (
				<p className="form-error" role="alert">{loadError}</p>
			) : isLoading ? (
				<p className="list-empty-state" role="status">Chargement de l&apos;historique…</p>
			) : !miseEnStock ? (
				<p className="list-empty-state">
					{isClosed
						? "Aucune sortie enregistrée : le lot attend sa mise en stock (hapas du traitement bloqués)."
						: "Le traitement doit être clôturé avant la sortie vers le stock."}
				</p>
			) : (
				<div className="list-content">
					<DataTable
						className="ecloserie-table table-with-actions"
						headers={[
							"Date de sortie",
							"Destination",
							"Finalité",
							"Effectif sortant",
							"Effectif entrant",
							"Écart",
							"Actions",
						]}
						rows={[
							[
								formatDateTime(miseEnStock.date_mise_en_stock),
								`Stock ${miseEnStock.reference_bassin}`,
								miseEnStock.finalite ? FINALITE_LABELS[miseEnStock.finalite] ?? miseEnStock.finalite : "—",
								effectifSortant.toLocaleString("fr-FR"),
								miseEnStock.effectif_entrant.toLocaleString("fr-FR"),
								miseEnStock.ecart_effectif ? (
									<span key="ecart" title={miseEnStock.justification_ecart || undefined}>
										{miseEnStock.ecart_effectif.toLocaleString("fr-FR")}
									</span>
								) : (
									"—"
								),
								<div key="actions" className="lot-actions">
									<DetailIconLink
										href={`/production/stock/${miseEnStock.id}`}
										label={`Voir la mise en stock du lot ${miseEnStock.reference_lot}`}
									/>
								</div>,
							],
						]}
					/>
					{miseEnStock.justification_ecart && (
						<p className="helper-text">Justification de l&apos;écart : {miseEnStock.justification_ecart}</p>
					)}
					<DataTable
						className="ecloserie-table"
						headers={["Hapa de traitement", "Effectif sortant"]}
						rows={traitement.hapas.map((hapa) => [
							hapa.nom_hapa,
							hapa.effectif_final === null ? "—" : hapa.effectif_final.toLocaleString("fr-FR"),
						])}
					/>
					<DataTable
						className="ecloserie-table"
						headers={["Hapa de stock", "Effectif entrant"]}
						rows={miseEnStock.hapas.map((hapa) => [hapa.nom_hapa, hapa.effectif_entrant.toLocaleString("fr-FR")])}
					/>
				</div>
			)}
		</section>
	);
}
