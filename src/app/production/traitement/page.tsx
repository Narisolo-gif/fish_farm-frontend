"use client";

import Link from "next/link";
import { DetailIconLink } from "@/components/DetailIconLink";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { DataTable } from "@/components/DataTable";
import { ListSearch } from "@/components/ListSearch";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { usePagination } from "@/app/hooks/usePagination";
import { apiRequest } from "@/lib/apiClient";

type ApiTraitement = {
	id: number;
	id_lot: number;
	reference_lot: string;
	reference_bassin: string;
	reference_provende: string;
	date_ouverture: string;
	date_cloture: string | null;
	statut: "EN_COURS" | "CLOTUREE" | string;
};

type TraitementsResponse = ApiTraitement[] | { results: ApiTraitement[] };

function getResults(response: TraitementsResponse): ApiTraitement[] {
	return Array.isArray(response) ? response : response.results;
}

function formatDate(date: string | null) {
	if (!date) {
		return "—";
	}

	const [year, month, day] = date.split("-");
	return year && month && day ? `${day}/${month}/${year}` : date;
}

function getStatusLabel(status: ApiTraitement["statut"]) {
	switch (status) {
		case "EN_COURS":
			return "En cours";
		case "CLOTUREE":
			return "Clôturé";
		default:
			return status;
	}
}

export default function TraitementsPage() {
	const [traitements, setTraitements] = useState<ApiTraitement[]>([]);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const normalizedSearch = search.trim().toLocaleLowerCase();
	const filteredTraitements = traitements.filter((traitement) =>
		[
			traitement.id,
			traitement.reference_lot,
			traitement.reference_bassin,
			traitement.reference_provende,
			getStatusLabel(traitement.statut),
			traitement.date_ouverture,
			traitement.date_cloture ?? "",
		]
			.join(" ")
			.toLocaleLowerCase()
			.includes(normalizedSearch),
	);
	const {
		items: visibleTraitements,
		currentPage,
		totalPages,
		goToPage,
		startItem,
		endItem,
	} = usePagination(filteredTraitements, 10);

	useEffect(() => {
		let isActive = true;

		async function loadTraitements() {
			const accessToken = localStorage.getItem("access_token");
			if (!accessToken) {
				setError("Votre session a expiré. Veuillez vous reconnecter.");
				setLoading(false);
				return;
			}

			try {
				const response = await apiRequest<TraitementsResponse>("/api/v1/traitement/", {
					headers: { Authorization: `Bearer ${accessToken}` },
				});
				if (isActive) {
					setTraitements(getResults(response));
				}
			} catch (loadError) {
				if (isActive) {
					setError(
						loadError instanceof Error
							? loadError.message
							: "Impossible de charger les traitements.",
					);
				}
			} finally {
				if (isActive) {
					setLoading(false);
				}
			}
		}

		void loadTraitements();

		return () => {
			isActive = false;
		};
	}, []);

	return (
		<div className="page">
			<PageHeader
				eyebrow="Production"
				title="Traitements"
				description="Suivi des lots en traitement."
				action={<Button href="/production/traitement/nouveau">+ Nouveau traitement</Button>}
			/>

			{error && <p role="alert" className="login-error">{error}</p>}
			{loading ? (
				<p role="status">Chargement des traitements...</p>
			) : error ? null : (
				<div className="list-content">
					<div className="list-toolbar">
						<ListSearch
							value={search}
							onChange={(value) => {
								setSearch(value);
								goToPage(1);
							}}
							placeholder="Lot, bassin, provende, statut..."
							label="Rechercher un traitement"
						/>
						<span className="list-result-count">
							{filteredTraitements.length} {filteredTraitements.length === 1 ? "traitement" : "traitements"}
						</span>
					</div>

					<section className="ecloserie-section" aria-label="Liste des traitements">
						{visibleTraitements.length > 0 ? (
							<DataTable
								className="ecloserie-table table-with-actions"
								headers={["Traitement", "Lot", "Bassin", "Provende", "Statut", "Ouvert le", "Clôturé le", "Actions"]}
								rows={visibleTraitements.map((traitement) => [
									<Link
										key={`traitement-${traitement.id}`}
										href={`/production/traitement/${traitement.id}`}
									>
										#{traitement.id}
									</Link>,
									traitement.reference_lot,
									traitement.reference_bassin,
									traitement.reference_provende,
									<span
										key={`statut-${traitement.id}`}
										className={`badge${traitement.statut === "CLOTUREE" ? " badge-amber" : " badge-green"}`}
									>
										{getStatusLabel(traitement.statut)}
									</span>,
									formatDate(traitement.date_ouverture),
									formatDate(traitement.date_cloture),
									<DetailIconLink
										key={`actions-${traitement.id}`}
										href={`/production/traitement/${traitement.id}`}
										label={`Voir le détail du traitement #${traitement.id}`}
									/>,
								])}
							/>
						) : (
							<p className="list-empty-state">
								{traitements.length === 0
									? "Aucun traitement enregistré pour le moment."
									: "Aucun traitement ne correspond à la recherche."}
							</p>
						)}
						<Pagination
							currentPage={currentPage}
							totalPages={totalPages}
							totalItems={filteredTraitements.length}
							startItem={startItem}
							endItem={endItem}
							onPageChange={goToPage}
						/>
					</section>
				</div>
			)}
		</div>
	);
}
