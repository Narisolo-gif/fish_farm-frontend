"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { Breadcrumb, PageHeader } from "@/components/PageHeader";
import { apiRequest } from "@/lib/apiClient";

type Role = {
	id: number;
	libelle: string;
};

type RolesResponse = Role[] | { results: Role[] };

export default function NewUserPage() {
	const router = useRouter();
	const [roles, setRoles] = useState<Role[]>([]);
	const [rolesLoading, setRolesLoading] = useState(true);
	const [lastName, setLastName] = useState("");
	const [firstName, setFirstName] = useState("");
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [roleId, setRoleId] = useState("");
	const [isActive, setIsActive] = useState("true");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const accessToken = localStorage.getItem("access_token");

		if (!accessToken) {
			setError("Votre session a expiré. Veuillez vous reconnecter.");
			setRolesLoading(false);
			return;
		}

		apiRequest<RolesResponse>("/api/roles", {
			headers: { Authorization: `Bearer ${accessToken}` },
		})
			.then((response) => {
				setRoles(Array.isArray(response) ? response : response.results);
			})
			.catch((err: unknown) => {
				setError(
					err instanceof Error
						? err.message
						: "Impossible de charger les rôles.",
				);
			})
			.finally(() => setRolesLoading(false));
	}, []);

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
			await apiRequest("/api/users/", {
				method: "POST",
				headers: { Authorization: `Bearer ${accessToken}` },
				body: JSON.stringify({
					last_name: lastName,
					first_name: firstName,
					username,
					email,
					role: Number(roleId),
					is_active: isActive === "true",
				}),
			});
			router.push("/admin/users");
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Impossible de créer cet utilisateur.",
			);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="page">
			<Breadcrumb items={["Utilisateurs", "Nouveau"]} />
			<PageHeader
				title="Ajouter / Modifier un utilisateur"
				description="Créez un accès pour un membre de l'équipe."
			/>
			<form className="form-card" onSubmit={handleSubmit}>
				<label>
					Nom
					<input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Ex. Rasoanaivo" required />
				</label>
				<label>
					Prénom
					<input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Ex. Marie" required />
				</label>
				<label>
					Username
					<input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Ex. marie.rasoanaivo" required />
				</label>
				<label>
					Email
					<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nom@fishfarm.local" required />
				</label>
				<label>
					Rôle

					<select value={roleId} onChange={(event) => setRoleId(event.target.value)} required disabled={rolesLoading || roles.length === 0}>
						<option value="" disabled>
							{rolesLoading ? "Chargement des rôles..." : "Sélectionner un rôle"}
						</option>
						{roles.map((role) => (
							<option key={role.id} value={role.id}>{role.libelle}</option>
						))}
					</select>
				</label>
				<label>
					Statut
					<select value={isActive} onChange={(event) => setIsActive(event.target.value)}>
						<option value="true">Actif</option>
						<option value="false">Désactivé</option>
					</select>
				</label>
				{error && <p role="alert" className="login-error">{error}</p>}
				<div className="form-actions">
					<Button variant="ghost" href="/admin/users">
						Annuler
					</Button>
					<button
						type="submit"
						className="button button-primary"
						disabled={loading || rolesLoading || roles.length === 0}
					>
						{loading ? "Enregistrement..." : "Enregistrer"}
					</button>
				</div>
			</form>
		</div>
	);
}
