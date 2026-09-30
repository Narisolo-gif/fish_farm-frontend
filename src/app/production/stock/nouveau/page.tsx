import { Breadcrumb, PageHeader } from "@/components/PageHeader";
import { StockForm } from "@/app/features/production/stocks/components/StockForm";

export default function NewTraitementPage() {
    return (
        <div className="page">
            <Breadcrumb items={["Lot stockage", "Nouveau"]} />
            <PageHeader
                eyebrow="Production"
                title="Ouvrir un stock"
                description="Associez un lot à un bassin et indiquez la date de début."
            />
            <StockForm />
        </div>
    );
}
