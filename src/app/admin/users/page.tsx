"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { DataTable } from "@/components/DataTable";
import { ListSearch } from "@/components/ListSearch";
import { Pagination } from "@/components/Pagination";
import { PageHeader } from "@/components/PageHeader";
import { apiRequest } from "@/lib/apiClient";
import { useDebouncedValue } from "@/app/hooks/useDebouncedValue";
import { usePagination } from "@/app/hooks/usePagination";

type ApiUser = {
	id: number;
	username: string;
	first_name?: string;
	last_name?: string;
	email?: string;
	role?: string | { id: number; libelle: string } | null;
	is_active?: boolean;
	status?: string;
};

type UserListResponse = ApiUser[] | { results: ApiUser[] };
type Role = { id: number; libelle: string };
type RolesResponse = Role[] | { results: Role[] };

type EditUserForm = {
	first_name: string;
	last_name: string;
	email: string;
	role: string;
	is_active: boolean;
};

export default function UsersPage() {
	const [users, setUsers] = useState<ApiUser[]>([]);
	const [roles, setRoles] = useState<Role[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [rolesError, setRolesError] = useState("");
	const [notice, setNotice] = useState("");
	const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
	const [editForm, setEditForm] = useState<EditUserForm>({
		first_name: "",
		last_name: "",
		email: "",
		role: "",
		is_active: true,
	});
	const [saving, setSaving] = useState(false);
	const [actionUserId, setActionUserId] = useState<number | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const debouncedSearchTerm = useDebouncedValue(searchTerm);
	const normalizedSearchTerm = debouncedSearchTerm.trim().toLocaleLowerCase();
	const filteredUsers = users.filter((user) => {
		const role = typeof user.role === "object" && user.role !== null
			? user.role.libelle
			: user.role ?? "";
		const searchableText = [
			user.first_name,
			user.last_name,
			user.username,
			user.email,
			role,
			getActive(user) ? "actif" : "désactivé",
		]
			.filter(Boolean)
			.join(" ")
			.toLocaleLowerCase();

		return searchableText.includes(normalizedSearchTerm);
	});
	const {
		items: paginatedUsers,
		currentPage,
		totalPages,
		goToPage,
		startItem,
		endItem,
	} = usePagination(filteredUsers, 10);

	useEffect(() => {
		const accessToken = localStorage.getItem("access_token");

		if (!accessToken) {
			setError("Votre session a expiré. Veuillez vous reconnecter.");
			setLoading(false);
			return;
		}

		apiRequest<RolesResponse>("/api/roles", {
			headers: { Authorization: `Bearer ${accessToken}` },
		})
			.then((response) => {
				setRoles(Array.isArray(response) ? response : response.results);
			})
			.catch((err: unknown) => {
				setRolesError(
					err instanceof Error ? err.message : "Impossible de charger les rôles.",
				);
			});

		apiRequest<UserListResponse>("/api/users/", {
			headers: { Authorization: `Bearer ${accessToken}` },
		})
			.then((response) => {
				setUsers(Array.isArray(response) ? response : response.results);
			})
			.catch((err: unknown) => {
				setError(
					err instanceof Error
						? err.message
						: "Impossible de charger les utilisateurs.",
				);
			})
			.finally(() => setLoading(false));
	}, []);

	function getActive(user: ApiUser) {
		return user.is_active ?? user.status !== "Désactivé";
	}

	function getRoleId(user: ApiUser) {
		if (typeof user.role === "object" && user.role !== null) {
			return String(user.role.id);
		}
		return String(roles.find((role) => role.libelle === user.role)?.id ?? user.role ?? "");
	}

	function startEditing(user: ApiUser) {
		setNotice("");
		setError("");
		setEditingUser(user);
		setEditForm({
			first_name: user.first_name ?? "",
			last_name: user.last_name ?? "",
			email: user.email ?? "",
			role: getRoleId(user),
			is_active: getActive(user),
		});
	}

	async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!editingUser) return;

		const accessToken = localStorage.getItem("access_token");
		if (!accessToken) {
			setError("Votre session a expiré. Veuillez vous reconnecter.");
			return;
		}

		setSaving(true);
		setError("");
		try {
			await apiRequest(`/api/users/${editingUser.id}/`, {
				method: "PATCH",
				headers: { Authorization: `Bearer ${accessToken}` },
				body: JSON.stringify({
					...editForm,
					role: Number(editForm.role),
				}),
			});

			setUsers((currentUsers) =>
				currentUsers.map((user) =>
					user.id === editingUser.id
						? {
							...user,
							...editForm,
							role: roles.find((role) => role.id === Number(editForm.role)) ?? user.role,
						}
						: user,
				),
			);
			setEditingUser(null);
			setNotice("Les informations de l'utilisateur ont été mises à jour.");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Impossible de modifier cet utilisateur.");
		} finally {
			setSaving(false);
		}
	}

	async function toggleActive(user: ApiUser) {
		const accessToken = localStorage.getItem("access_token");
		if (!accessToken) {
			setError("Votre session a expiré. Veuillez vous reconnecter.");
			return;
		}

		setActionUserId(user.id);
		setError("");
		setNotice("");
		const isActive = !getActive(user);
		try {
			await apiRequest(`/api/users/${user.id}/`, {
				method: "PATCH",
				headers: { Authorization: `Bearer ${accessToken}` },
				body: JSON.stringify({ is_active: isActive }),
			});
			setUsers((currentUsers) =>
				currentUsers.map((item) =>
					item.id === user.id ? { ...item, is_active: isActive } : item,
				),
			);
			setNotice(`Le compte de ${user.username} a été ${isActive ? "activé" : "désactivé"}.`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Impossible de modifier le statut.");
		} finally {
			setActionUserId(null);
		}
	}

	async function resetPassword(user: ApiUser) {
		if (!window.confirm(`Confirmer la réinitialisation du mot de passe de ${user.username} ?`)) {
			return;
		}

		const accessToken = localStorage.getItem("access_token");
		if (!accessToken) {
			setError("Votre session a expiré. Veuillez vous reconnecter.");
			return;
		}

		setActionUserId(user.id);
		setError("");
		setNotice("");
		try {
			await apiRequest(`/api/users/${user.id}/reset-password/`, {
				method: "POST",
				headers: { Authorization: `Bearer ${accessToken}` },
			});
			setNotice(`Le mot de passe de ${user.username} a été réinitialisé.`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Impossible de réinitialiser le mot de passe.");
		} finally {
			setActionUserId(null);
		}
	}

	return (
		<div className="page">
			<PageHeader
				eyebrow="ADMINISTRATION"
				title="Utilisateurs"
				description="Gérez les utilisateurs."
				action={<Button href="/admin/users/new">+ Ajouter</Button>}
			/>
			{error && <p role="alert" className="login-error">{error}</p>}
			{notice && <p role="status" className="helper-text">{notice}</p>}
			{loading ? (
				<p>Chargement des utilisateurs...</p>
			) : error && users.length === 0 ? null : (
				<div className="list-content">
					<div className="list-toolbar">
						<ListSearch
							value={searchTerm}
							onChange={(value) => {
								setSearchTerm(value);
								goToPage(1);
							}}
							placeholder="Nom, email, rôle..."
							label="Rechercher un utilisateur"
						/>
						<span className="list-result-count">
							{filteredUsers.length} {filteredUsers.length === 1 ? "utilisateur" : "utilisateurs"}
						</span>
					</div>
					{filteredUsers.length === 0 ? (
						<p className="list-empty-state">
							{users.length === 0 ? "Aucun utilisateur trouvé." : "Aucun résultat pour cette recherche."}
						</p>
					) : (
						<>
							<DataTable
								headers={["Nom", "Email", "Rôle", "Statut", "Actions"]}
								rows={paginatedUsers.map((user) => {
									const name = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
									const active = getActive(user);
									const role = typeof user.role === "object" && user.role !== null
										? user.role.libelle
										: user.role ?? "—";

									return [
										name || user.username,
										user.email || "—",
										role,
										<span
											className={active ? "badge badge-green" : "badge"}
											key={`${user.id}-status`}
										>
											{active ? "Actif" : "Désactivé"}
										</span>,
										<div className="user-actions" key={`${user.id}-actions`}>
											<button type="button" className="button button-ghost table-action" onClick={() => startEditing(user)}>
												Modifier
											</button>
											<button
												type="button"
												className={`button table-action ${active ? "button-danger" : "button-ghost"}`}
												onClick={() => void toggleActive(user)}
												disabled={actionUserId === user.id}
											>
												{active ? "Désactiver" : "Activer"}
											</button>
											<button
												type="button"
												className="button button-ghost table-action"
												onClick={() => void resetPassword(user)}
												disabled={actionUserId === user.id}
											>
												Réinitialiser le mot de passe
											</button>
										</div>,
									];
								})}
							/>
							<Pagination
								currentPage={currentPage}
								totalPages={totalPages}
								totalItems={filteredUsers.length}
								startItem={startItem}
								endItem={endItem}
								onPageChange={goToPage}
							/>
						</>
					)}
				</div>
			)}
			{editingUser && (
				<div className="user-dialog-backdrop">
					<section className="user-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-user-title">
						<h2 id="edit-user-title">Modifier {editingUser.username}</h2>
						{rolesError && <p role="alert" className="login-error">{rolesError}</p>}
						<form onSubmit={handleEditSubmit}>
							<label>
								Nom
								<input value={editForm.last_name} onChange={(event) => setEditForm({ ...editForm, last_name: event.target.value })} required />
							</label>
							<label>
								Prénom
								<input value={editForm.first_name} onChange={(event) => setEditForm({ ...editForm, first_name: event.target.value })} required />
							</label>
							<label>
								Email
								<input type="email" value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} required />
							</label>
							<label>
								Rôle
								<select value={editForm.role} onChange={(event) => setEditForm({ ...editForm, role: event.target.value })} required disabled={roles.length === 0}>
									<option value="" disabled>{rolesError ? "Rôles indisponibles" : "Sélectionner un rôle"}</option>
									{roles.map((role) => <option key={role.id} value={role.id}>{role.libelle}</option>)}
								</select>
							</label>
							<label>
								Statut
								<select value={String(editForm.is_active)} onChange={(event) => setEditForm({ ...editForm, is_active: event.target.value === "true" })}>
									<option value="true">Actif</option>
									<option value="false">Désactivé</option>
								</select>
							</label>
							<div className="form-actions">
								<button type="button" className="button button-ghost" onClick={() => setEditingUser(null)}>Annuler</button>
								<button type="submit" className="button button-primary" disabled={saving || roles.length === 0}>
									{saving ? "Enregistrement..." : "Enregistrer"}
								</button>
							</div>
						</form>
					</section>
				</div>
			)}
		</div>
	);
}
