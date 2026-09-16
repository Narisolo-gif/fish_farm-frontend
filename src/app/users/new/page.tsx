import { Button } from "@/components/ui";
import { Breadcrumb, PageHeader } from "@/components/PageHeader";

export default function NewUserPage() {
	return (
		<div className="page">
			<Breadcrumb items={["Utilisateurs", "Nouveau"]} />
			<PageHeader
				title="Ajouter / Modifier un utilisateur"
				description="Créez un accès pour un membre de l'équipe."
			/>
			<form className="form-card">
				<Field label="Nom complet" placeholder="Ex. Marie Rasoanaivo" />
				<Field label="Email" placeholder="nom@fishfarm.local" type="email" />
				<Field label="Rôle" placeholder="Sélectionner un rôle" />
				<Field label="Statut" placeholder="Actif" />
				<div className="form-actions">
					<Button variant="ghost" href="/users">
						Annuler
					</Button>
					<Button>Enregistrer</Button>
				</div>
			</form>
		</div>
	);
}

function Field({
	label,
	placeholder,
	type = "text",
}: {
	label: string;
	placeholder: string;
	type?: string;
}) {
	return (
		<label>
			{label}
			<input type={type} placeholder={placeholder} />
		</label>
	);
}
