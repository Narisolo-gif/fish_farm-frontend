"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { DataTable } from "@/components/DataTable";
import { DetailIconLink } from "@/components/DetailIconLink";
import { ListSearch } from "@/components/ListSearch";
import { Pagination } from "@/components/Pagination";
import { PageHeader } from "@/components/PageHeader";
import { usePagination } from "@/app/hooks/usePagination";
import { apiRequest } from "@/lib/apiClient";

type ApiHapa = {
	id: number;
	reference: string;
	bassin: number;
	capacity: number;
	statut: string;
	nom: string;
	actif: boolean;
	created_at: string;
};

type ApiBassin = {
	id: number;
	reference: string;
	categorie: string;
	capacity: number;
	statut: string;
	hapas: ApiHapa[];
};

type BassinsResponse = ApiBassin[] | { results: ApiBassin[] };

const rowsPerPage = 10;

export default function BassinsPage() {
	const [bassins, setBassins] = useState<ApiBassin[]>([]);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const normalizedSearch = search.trim().toLocaleLowerCase();
	const filteredBassins = bassins.filter((bassin) =>
		[
			bassin.reference,
			bassin.categorie,
			bassin.statut,
			...bassin.hapas.map((hapa) => hapa.nom),
			...bassin.hapas.map((hapa) => hapa.reference),
		]
			.join(" ")
			.toLocaleLowerCase()
			.includes(normalizedSearch),
	);
	const {
		items: visibleBassins,
		currentPage,
		totalPages,
		goToPage,
		startItem,
		endItem,
	} = usePagination(filteredBassins, rowsPerPage);

	useEffect(() => {
		let isActive = true;

		async function loadBassins() {
			const accessToken = localStorage.getItem("access_token");
			if (!accessToken) {
				setError("Votre session a expiré. Veuillez vous reconnecter.");
				setLoading(false);
				return;
			}

			try {
				const response = await apiRequest<BassinsResponse>("/api/v1/bassins/", {
					headers: { Authorization: `Bearer ${accessToken}` },
				});
				if (isActive) {
					setBassins(Array.isArray(response) ? response : response.results);
				}
			} catch (err) {
				if (isActive) {
					setError(
						err instanceof Error
							? err.message
							: "Impossible de charger les bassins.",
					);
				}
			} finally {
				if (isActive) {
					setLoading(false);
				}
			}
		}

		void loadBassins();

		return () => {
			isActive = false;
		};
	}, []);

	return (
		<div className="page">
			<PageHeader
				eyebrow="Production"
				title="Bassins et hapas"
				description="Gestion des bassins et des hapas."
				action={<Button href="/bassins/new">+ Nouveau bassin</Button>}
			/>
			{error && <p role="alert" className="login-error">{error}</p>}
			{loading ? (
				<p role="status">Chargement des bassins...</p>
			) : error ? null : (
				<div className="list-content">
					<div className="list-toolbar">
						<ListSearch
							value={search}
							onChange={(value) => {
								setSearch(value);
								goToPage(1);
							}}
							placeholder="Référence, catégorie, statut..."
							label="Rechercher un bassin"
						/>
						<span className="list-result-count">
							{filteredBassins.length} {filteredBassins.length === 1 ? "bassin" : "bassins"}
						</span>
					</div>
					<section className="ecloserie-section" aria-label="Liste des bassins">
						{visibleBassins.length > 0 ? (
							<DataTable
								className="ecloserie-table table-with-actions"
								headers={["Référence", "Catégorie", "Capacité", "Nombre d'hapas", "Statut", "Actions"]}
								rows={visibleBassins.map((bassin) => [
									bassin.reference,
									bassin.categorie,
									bassin.capacity.toLocaleString("fr-FR"),
									bassin.hapas.length.toLocaleString("fr-FR"),
									bassin.statut,
									<DetailIconLink
										key={`bassin-${bassin.id}`}
										href={`/bassins/${bassin.id}`}
										label={`Voir les effectifs et mouvements du bassin ${bassin.reference}`}
									/>,
								])}
							/>
						) : (
							<p className="list-empty-state">
								{bassins.length === 0
									? "Aucun bassin enregistré pour le moment."
									: "Aucun bassin ne correspond à la recherche."}
							</p>
						)}
						<Pagination
							currentPage={currentPage}
							totalPages={totalPages}
							totalItems={filteredBassins.length}
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
