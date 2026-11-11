"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { ListSearch } from "@/components/ListSearch";
import { Pagination } from "@/components/Pagination";
import { SectionHeading, StatCard } from "@/components/ui";
import { usePagination } from "@/app/hooks/usePagination";
import { matchesSearch } from "@/lib/search";
import { getMouvements } from "@/app/features/production/shared/mortalite-ui/services/mortaliteApi";
import {
	TYPE_MOUVEMENT_LABELS,
	compareMouvements,
	especeLabel,
	type JournalHapa,
	type MouvementEffectif,
} from "@/app/features/production/shared/mortalite-ui/types/mortalite.types";

const rowsPerPage = 15;

type MouvementLigne = MouvementEffectif & { effectifApres: number; estAnnule: boolean };

function formatDate(value: string) {
	const date = new Date(`${value}T00:00:00`);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR");
}

/**
 * Suivi du registre des effectifs d'un bassin : effectif vivant par espèce et par hapa,
 * puis journal chronologique des mouvements avec l'effectif de l'espèce après chaque ligne.
 */
export function BassinMouvementsSection({
	bassinId,
	hapas,
	reloadKey = 0,
}: {
	bassinId: number;
	hapas: JournalHapa[];
	/** Incrémenté par le parent pour recharger après une saisie dans une autre section. */
	reloadKey?: number;
}) {
	const [mouvements, setMouvements] = useState<MouvementEffectif[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [typeFilter, setTypeFilter] = useState("");
	const [especeFilter, setEspeceFilter] = useState("");
	const [hapaFilter, setHapaFilter] = useState("");

	useEffect(() => {
		let isActive = true;
		getMouvements({ bassin: bassinId })
			.then((loaded) => {
				if (isActive) {
					setMouvements(loaded);
					setError("");
				}
			})
			.catch((loadError: unknown) => {
				if (isActive) {
					setError(loadError instanceof Error ? loadError.message : "Impossible de charger les mouvements.");
				}
			})
			.finally(() => {
				if (isActive) setIsLoading(false);
			});
		return () => {
			isActive = false;
		};
	}, [bassinId, reloadKey]);

	const lignes = useMemo<MouvementLigne[]>(() => {
		const annules = new Set(mouvements.flatMap((item) => (item.annule_mouvement ? [item.annule_mouvement] : [])));
		const soldes = new Map<string, number>();
		return [...mouvements]
			.sort(compareMouvements)
			.map((mouvement) => {
				const solde = (soldes.get(mouvement.espece) ?? 0) + mouvement.sens * mouvement.quantite;
				soldes.set(mouvement.espece, solde);
				return { ...mouvement, effectifApres: solde, estAnnule: annules.has(mouvement.id) };
			})
			.reverse();
	}, [mouvements]);

	const parEspece = useMemo(() => {
		const totals = new Map<string, number>();
		for (const item of mouvements) {
			totals.set(item.espece, (totals.get(item.espece) ?? 0) + item.sens * item.quantite);
		}
		return [...totals].sort(([a], [b]) => a.localeCompare(b));
	}, [mouvements]);

	const parHapa = useMemo(() => {
		const totals = new Map<string, { nom: string; espece: string; effectif: number }>();
		for (const item of mouvements) {
			if (item.hapa === null) continue;
			const key = `${item.hapa}-${item.espece}`;
			const current = totals.get(key) ?? {
				nom: item.nom_hapa ?? hapas.find((hapa) => hapa.id === item.hapa)?.nom ?? `#${item.hapa}`,
				espece: item.espece,
				effectif: 0,
			};
			current.effectif += item.sens * item.quantite;
			totals.set(key, current);
		}
		return [...totals.values()].filter((row) => row.effectif !== 0).sort((a, b) => a.nom.localeCompare(b.nom));
	}, [mouvements, hapas]);

	const types = [...new Set(mouvements.map((item) => item.type_mouvement))];
	const especes = parEspece.map(([espece]) => espece);
	const hapaOptions = [...new Map(mouvements.filter((item) => item.hapa).map((item) => [item.hapa, item.nom_hapa])).entries()];

	const filtered = lignes.filter(
		(ligne) =>
			(!typeFilter || ligne.type_mouvement === typeFilter) &&
			(!especeFilter || ligne.espece === especeFilter) &&
			(!hapaFilter || String(ligne.hapa) === hapaFilter) &&
			matchesSearch(
				[
					TYPE_MOUVEMENT_LABELS[ligne.type_mouvement] ?? ligne.type_mouvement,
					formatDate(ligne.date_evenement),
					ligne.nom_hapa,
					ligne.reference_lot_origine,
					ligne.reference_lot_grossissement,
					ligne.saisi_par_username,
					ligne.motif_annulation,
					ligne.quantite,
				],
				search,
			),
	);
	const { items: visible, currentPage, totalPages, goToPage, startItem, endItem } = usePagination(filtered, rowsPerPage);

	function resetPage<T>(setter: (value: T) => void) {
		return (value: T) => {
			setter(value);
			goToPage(1);
		};
	}

	if (error) return <p className="form-error" role="alert">{error}</p>;
	if (isLoading) return <p className="list-empty-state" role="status">Chargement des mouvements…</p>;

	return (
		<section className="bassin-mouvements" aria-label="Suivi des mouvements d'effectifs">
			<SectionHeading title="Effectif vivant actuel" />
			{parEspece.length === 0 ? (
				<p className="list-empty-state">Aucun poisson enregistré dans ce bassin.</p>
			) : (
				<div className="stats-grid">
					{parEspece.map(([espece, effectif]) => (
						<StatCard key={espece} label={especeLabel(espece)} value={effectif.toLocaleString("fr-FR")} detail="poissons vivants" />
					))}
				</div>
			)}

			{parHapa.length > 0 && (
				<DataTable
					className="ecloserie-table"
					headers={["Hapa", "Espèce", "Effectif vivant"]}
					rows={parHapa.map((row) => [row.nom, especeLabel(row.espece), row.effectif.toLocaleString("fr-FR")])}
				/>
			)}

			<SectionHeading title="Journal des mouvements" />
			<div className="list-content">
				<div className="list-toolbar">
					<ListSearch
						value={search}
						onChange={resetPage(setSearch)}
						placeholder="Type, lot, hapa, date, utilisateur..."
						label="Rechercher dans les mouvements du bassin"
					/>
					<label className="journal-filter">
						<span>Type</span>
						<select value={typeFilter} onChange={(event) => resetPage(setTypeFilter)(event.target.value)}>
							<option value="">Tous</option>
							{types.map((type) => (
								<option key={type} value={type}>{TYPE_MOUVEMENT_LABELS[type] ?? type}</option>
							))}
						</select>
					</label>
					{especes.length > 1 && (
						<label className="journal-filter">
							<span>Espèce</span>
							<select value={especeFilter} onChange={(event) => resetPage(setEspeceFilter)(event.target.value)}>
								<option value="">Toutes</option>
								{especes.map((espece) => (
									<option key={espece} value={espece}>{especeLabel(espece)}</option>
								))}
							</select>
						</label>
					)}
					{hapaOptions.length > 0 && (
						<label className="journal-filter">
							<span>Hapa</span>
							<select value={hapaFilter} onChange={(event) => resetPage(setHapaFilter)(event.target.value)}>
								<option value="">Tous</option>
								{hapaOptions.map(([id, nom]) => (
									<option key={id} value={String(id)}>{nom}</option>
								))}
							</select>
						</label>
					)}
					<span className="list-result-count" aria-live="polite">
						{filtered.length} mouvement{filtered.length > 1 ? "s" : ""}
					</span>
				</div>
				{visible.length > 0 ? (
					<DataTable
						className="ecloserie-table mouvements-table"
						headers={["Date", "Type", "Espèce", "Hapa", "Lot", "Mouvement", "Effectif après", "Saisi par", "Remarque"]}
						rows={visible.map((ligne) => [
							formatDate(ligne.date_evenement),
							<span key={`${ligne.id}-type`} className={`badge ${ligne.sens > 0 ? "badge-green" : "badge-amber"}`}>
								{TYPE_MOUVEMENT_LABELS[ligne.type_mouvement] ?? ligne.type_mouvement}
							</span>,
							especeLabel(ligne.espece),
							ligne.nom_hapa ?? "—",
							ligne.lot_origine ? (
								<Link key={`${ligne.id}-lot`} href={`/production/lots/${ligne.lot_origine}`}>
									{ligne.reference_lot_origine}
								</Link>
							) : (
								ligne.reference_lot_grossissement ?? "—"
							),
							<strong key={`${ligne.id}-qte`} className={ligne.sens > 0 ? "mouvement-plus" : "mouvement-moins"}>
								{ligne.sens > 0 ? "+" : "−"}
								{ligne.quantite.toLocaleString("fr-FR")}
							</strong>,
							ligne.effectifApres.toLocaleString("fr-FR"),
							ligne.saisi_par_username,
							ligne.annule_mouvement
								? `Annule le mouvement #${ligne.annule_mouvement}${ligne.motif_annulation ? ` : ${ligne.motif_annulation}` : ""}`
								: ligne.estAnnule
									? "Annulé"
									: "—",
						])}
					/>
				) : (
					<p className="list-empty-state">
						{lignes.length === 0 ? "Aucun mouvement enregistré pour ce bassin." : "Aucun mouvement ne correspond aux filtres."}
					</p>
				)}
				<Pagination
					currentPage={currentPage}
					totalPages={totalPages}
					totalItems={filtered.length}
					startItem={startItem}
					endItem={endItem}
					onPageChange={goToPage}
				/>
			</div>
		</section>
	);
}
