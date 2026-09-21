import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { SectionHeading, StatCard } from "@/components/ui";
import { orders, users } from "@/lib/data";

export default function AdminPage() {
	return (
		<div className="page">
			<PageHeader
				eyebrow="ADMINISTRATION"
				title="Accueil admin"
				description="Gérez les accès, les commandes et les stocks de l'exploitation."
			/>

			<div className="stats-grid three">
				<StatCard label="Utilisateurs" value={String(users.length)} detail="Accès enregistrés" />
				<StatCard label="Commandes" value={String(orders.length)} detail="Suivi fournisseurs" />
				<StatCard label="Commandes en cours" value={String(orders.filter((order) => order.status === "En cours").length)} detail="À surveiller" />
			</div>

			<section className="panel">
				<SectionHeading title="Commandes récentes" />
				<DataTable
					headers={["Référence", "Date", "Fournisseur", "Statut"]}
					rows={orders.map((order) => [
						<Link href={`/admin/orders/${order.reference}`} className="table-link" key={order.reference}>
							{order.reference}
						</Link>,
						order.date,
						order.supplier,
						<span
							className={order.status === "Livrée" ? "badge badge-green" : "badge badge-amber"}
							key={`${order.reference}-status`}
						>
							{order.status}
						</span>,
					])}
				/>
			</section>

			<div className="quick-links">
				<Link href="/admin/users">
					Utilisateurs <span>→</span>
				</Link>
				<Link href="/admin/orders">
					Commandes <span>→</span>
				</Link>
				<Link href="/admin/stock">
					Stock <span>→</span>
				</Link>
			</div>
		</div>
	);
}
