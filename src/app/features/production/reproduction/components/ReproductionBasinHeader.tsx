"use client";

import { useId } from "react";
import type { EnvironmentalBasin } from "@/app/features/production/shared/environnement/types/environment.types";
import type { ReproductionRecord } from "@/app/features/production/reproduction/types/reproduction.types";

/**
 * En-tête commun aux pages reproduction et écloserie :
 * sélection du bassin de reproduction, lot en cours et statut du lot.
 * Reprend la mise en forme de StockDetailHeader (`stock-meta`).
 */
export function ReproductionBasinHeader({
	basins,
	selectedBasinId,
	currentLot,
	isLoading,
	onSelectBasin,
}: {
	basins: Pick<EnvironmentalBasin, "id" | "reference" | "statut">[];
	selectedBasinId: number | null;
	currentLot: Pick<ReproductionRecord, "reference" | "statut"> | undefined;
	isLoading: boolean;
	onSelectBasin: (basinId: number | null) => void;
}) {
	const basinSelectId = useId();

	return (
		<dl className="stock-meta">
			<div>
				<dt><label htmlFor={basinSelectId}>Bassin</label></dt>
				<dd className="reproduction-control">
					<select
						id={basinSelectId}
						value={selectedBasinId ?? ""}
						onChange={(event) => onSelectBasin(event.target.value ? Number(event.target.value) : null)}
						disabled={isLoading || basins.length === 0}
					>
						{basins.length === 0 && (
							<option value="">{isLoading ? "Chargement des bassins..." : "Aucun bassin de reproduction"}</option>
						)}
						{basins.map((basin) => (
							<option value={basin.id} key={basin.id}>
								{basin.reference}{basin.statut === "ACTIF" ? "" : " (inactif)"}
							</option>
						))}
					</select>
				</dd>
			</div>
			<div>
				<dt>Lot en cours</dt>
				<dd aria-live="polite">{currentLot?.reference ?? (isLoading ? "Chargement..." : "Aucun")}</dd>
			</div>
			<div>
				<dt>Statut</dt>
				<dd aria-live="polite">
					{currentLot ? (
						<span className={`badge${currentLot.statut === "ACTIF" ? " badge-green" : " badge-amber"}`}>
							{currentLot.statut === "ACTIF" ? "Actif" : "Inactif"}
						</span>
					) : "—"}
				</dd>
			</div>
		</dl>
	);
}

/** Lot à afficher : le lot actif du bassin, sinon le plus récent (l'API trie par date décroissante). */
export function getCurrentLot<T extends Pick<ReproductionRecord, "statut">>(basinReproductions: T[]) {
	return basinReproductions.find((reproduction) => reproduction.statut === "ACTIF") ?? basinReproductions[0];
}
