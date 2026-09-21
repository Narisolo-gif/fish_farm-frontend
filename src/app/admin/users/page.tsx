import { Button } from "@/components/ui";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { users } from "@/lib/data";

export default function UsersPage() {
	return (
		<div className="page">
			<PageHeader
				eyebrow="ADMINISTRATION"
				title="Utilisateurs"
				description="Gérez les accès à l'espace de pilotage."
				action={<Button href="/admin/users/new">+ Ajouter</Button>}
			/>
			<DataTable
				headers={["Nom", "Email", "Rôle", "Statut"]}
				rows={users.map((user) => [
					user.name,
					user.email,
					user.role,
					<span
						className={user.status === "Actif" ? "badge badge-green" : "badge"}
						key={user.email}
					>
						{user.status}
					</span>,
				])}
			/>
		</div>
	);
}
