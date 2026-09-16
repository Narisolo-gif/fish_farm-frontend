import { Button } from "@/components/ui";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { orders } from "@/lib/data";
import Link from "next/link";

export default function OrdersPage() {
    return (
        <div className="page">
            <PageHeader
                eyebrow="APPROVISIONNEMENT"
                title="Liste des commandes"
                description="Commandes fournisseurs et flux entrants."
                action={<Button href="/orders/new">+ Nouvelle commande</Button>}
            />
            <div className="filter-row">
                <button>Filtre statut</button>
                <button>Filtre date</button>
            </div>
            <DataTable
                headers={["Référence", "Date", "Fournisseur", "Montant", "Statut"]}
                rows={orders.map((order) => [
                    <Link
                        href={`/orders/${order.reference}`}
                        className="table-link"
                        key={order.reference}
                    >
                        {order.reference}
                    </Link>,
                    order.date,
                    order.supplier,
                    order.amount,
                    <span
                        key={`${order.reference}-status`}
                        className={order.status === "Livrée" ? "badge badge-green" : "badge badge-amber"}
                    >
                        {order.status}
                    </span>
                ])}
            />
        </div>
    );
}
