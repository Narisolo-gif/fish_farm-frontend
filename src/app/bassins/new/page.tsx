"use client";

import { type FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { Breadcrumb, PageHeader } from "@/components/PageHeader";
import { apiRequest } from "@/lib/apiClient";

const basinCategories = [
	{ value: "REPRODUCTION", label: "Reproduction" },
	{ value: "ECLOSERIE", label: "Écloserie" },
	{ value: "TRAITEMENT", label: "Traitement" },
	{ value: "STOCKS", label: "Stocks" },
	{ value: "GROSSISSEMENT", label: "Grossissement" },
] as const;

type BasinCategory = (typeof basinCategories)[number]["value"];

type HapaInput = {
	id: number;
	name: string;
	capacity: string;
};

export default function NewBasinPage() {
	const router = useRouter();
	const [reference, setReference] = useState("");
	const [category, setCategory] = useState<BasinCategory | "">("");
	const [capacity, setCapacity] = useState("");
	const [hapas, setHapas] = useState<HapaInput[]>([]);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const nextHapaId = useRef(0);

	function addHapa() {
		nextHapaId.current += 1;
		setHapas((currentHapas) => [
			...currentHapas,
			{ id: nextHapaId.current, name: "", capacity: "" },
		]);
	}

	function updateHapa(id: number, field: "name" | "capacity", value: string) {
		setHapas((currentHapas) =>
			currentHapas.map((hapa) =>
				hapa.id === id ? { ...hapa, [field]: value } : hapa,
			),
		);
	}

	function removeHapa(id: number) {
		setHapas((currentHapas) => currentHapas.filter((hapa) => hapa.id !== id));
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		setLoading(true);

		const accessToken = localStorage.getItem("access_token");
		if (!accessToken) {
			setError("Votre session a expiré. Veuillez vous reconnecter.");
			setLoading(false);
			return;
		}

		try {
			await apiRequest("/api/v1/bassins/", {
				method: "POST",
				headers: { Authorization: `Bearer ${accessToken}` },
				body: JSON.stringify({
					reference: reference.trim(),
					categorie: category,
					capacity: Number(capacity),
					hapas: hapas.map((hapa) => ({
						nom: hapa.name.trim(),
						capacity: Number(hapa.capacity),
					})),
				}),
			});
			router.push("/bassins");
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Impossible d'enregistrer le bassin.",
			);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="page">
			<Breadcrumb items={["Bassins", "Nouveau"]} />
			<PageHeader
				title="Configuration bassin"
				description="Ajoutez un bassin et ses hapas."
			/>
			<form className="form-card wide" onSubmit={handleSubmit}>
				<div className="form-grid">
					<label>
						Référence
						<input
							type="text"
							value={reference}
							onChange={(event) => setReference(event.target.value)}
							placeholder="Ex. PM-STOCK-001"
							required
						/>
					</label>
					<label>
						Catégorie
						<select
							value={category}
							onChange={(event) => {
								const selectedCategory = basinCategories.find(
									(basinCategory) => basinCategory.value === event.target.value,
								);
								setCategory(selectedCategory?.value ?? "");
							}}
							required
						>
							<option value="" disabled>Sélectionner une catégorie</option>
							{basinCategories.map((basinCategory) => (
								<option key={basinCategory.value} value={basinCategory.value}>
									{basinCategory.label}
								</option>
							))}
						</select>
					</label>
					<label>
						Capacité
						<input
							type="number"
							min="0"
							step="any"
							inputMode="decimal"
							value={capacity}
							onChange={(event) => setCapacity(event.target.value)}
							required
						/>
					</label>
				</div>

				<div className="subsection">
					<div className="subsection-heading">
						<strong>Hapas (facultatif)</strong>
						<button type="button" className="button button-ghost" onClick={addHapa}>
							+ Ajouter un hapa
						</button>
					</div>
					{hapas.length > 0 && (
						<div className="happa-list">
							{hapas.map((hapa, index) => (
								<div className="happa-input" key={hapa.id}>
									<span>{String(index + 1).padStart(2, "0")}</span>
									<input
										type="text"
										aria-label={`Nom du hapa ${index + 1}`}
										placeholder="Nom du hapa"
										value={hapa.name}
										onChange={(event) => updateHapa(hapa.id, "name", event.target.value)}
										required
									/>
									<input
										type="number"
										min="0"
										step="any"
										inputMode="decimal"
										aria-label={`Capacité du hapa ${index + 1}`}
										placeholder="Capacité"
										value={hapa.capacity}
										onChange={(event) => updateHapa(hapa.id, "capacity", event.target.value)}
										required
									/>
									<button
										type="button"
										aria-label={`Supprimer le hapa ${index + 1}`}
										onClick={() => removeHapa(hapa.id)}
									>
										×
									</button>
								</div>
							))}
						</div>
					)}
				</div>

				{error && <p role="alert" className="login-error">{error}</p>}
				<div className="form-actions">
					<Button variant="ghost" href="/bassins">
						Annuler
					</Button>
					<button type="submit" className="button button-primary" disabled={loading}>
						{loading ? "Enregistrement..." : "Enregistrer le bassin"}
					</button>
				</div>
			</form>
		</div>
	);
}
