"use client";

import { useEffect, useMemo, useState } from "react";
import { StatCard } from "@/components/ui";
import { getMouvements } from "@/app/features/production/shared/mortalite-ui/services/mortaliteApi";
import {
	sommeEffectif,
	type JournalHapa,
	type MouvementEffectif,
} from "@/app/features/production/shared/mortalite-ui/types/mortalite.types";

/** Types de mouvement qui situent un lot dans un hapa (règle backend `lots_presents_dans_hapa`). */
const TYPES_PRESENCE_LOT = new Set(["ENTREE", "SORTIE", "VENTE", "ANNULATION"]);

type HapaPlan = { hapa: JournalHapa; effectif: number; autresLots: string[] };

/**
 * Plan : effectif vivant actuel de chaque hapa contenant le lot.
 * L'effectif est celui du hapa (somme du registre) : c'est celui du lot quand il y est seul.
 */
export function PlanHapasSection({
	bassinId,
	lotId,
	hapas,
}: {
	bassinId: number;
	lotId: number;
	hapas: JournalHapa[];
}) {
	const [mouvements, setMouvements] = useState<MouvementEffectif[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState("");

	useEffect(() => {
		let isActive = true;
		getMouvements({ bassin: bassinId })
			.then((result) => {
				if (isActive) setMouvements(result);
			})
			.catch((error: unknown) => {
				if (isActive) setLoadError(error instanceof Error ? error.message : "Impossible de charger les effectifs.");
			})
			.finally(() => {
				if (isActive) setIsLoading(false);
			});
		return () => {
			isActive = false;
		};
	}, [bassinId]);

	const plan = useMemo<HapaPlan[]>(
		() =>
			hapas.map((hapa) => {
				const duHapa = mouvements.filter((mouvement) => mouvement.hapa === hapa.id);
				const restantParLot = new Map<number, { reference: string; restant: number }>();
				for (const mouvement of duHapa) {
					if (mouvement.lot_origine === null || !TYPES_PRESENCE_LOT.has(mouvement.type_mouvement)) continue;
					const courant = restantParLot.get(mouvement.lot_origine) ?? {
						reference: mouvement.reference_lot_origine ?? `#${mouvement.lot_origine}`,
						restant: 0,
					};
					courant.restant += mouvement.sens * mouvement.quantite;
					restantParLot.set(mouvement.lot_origine, courant);
				}
				const autresLots = [...restantParLot]
					.filter(([id, item]) => id !== lotId && item.restant > 0)
					.map(([, item]) => item.reference);
				return { hapa, effectif: sommeEffectif(duHapa), autresLots };
			}),
		[hapas, mouvements, lotId],
	);

	if (loadError) return <p className="form-error" role="alert">{loadError}</p>;
	if (isLoading) return <p className="list-empty-state" role="status">Chargement des effectifs…</p>;
	if (hapas.length === 0) return <p className="list-empty-state">Aucun hapa associé à ce lot.</p>;

	return (
		<section className="treatment-mortality" aria-label="Plan des hapas">
			<div className="treatment-mortality-heading">
				<h2>Effectif vivant actuel par hapa</h2>
			</div>
			<div className="stats-grid three">
				{plan.map(({ hapa, effectif, autresLots }) => (
					<StatCard
						key={hapa.id}
						label={hapa.nom}
						value={effectif.toLocaleString("fr-FR")}
						detail={
							autresLots.length > 0
								? `Hapa partagé avec ${autresLots.join(", ")} : effectif total du hapa`
								: effectif > 0
									? "poissons vivants"
									: "hapa vide"
						}
					/>
				))}
			</div>
		</section>
	);
}
