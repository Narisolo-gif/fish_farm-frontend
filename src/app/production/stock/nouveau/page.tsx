import { Breadcrumb, PageHeader } from "@/components/PageHeader";
import { StockForm } from "@/app/features/production/stocks/components/StockForm";

export default async function NewTraitementPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    // `?lot=` : arrivée depuis l'historique de sortie d'un traitement clôturé.
    const { lot } = await searchParams;

    return (
        <div className="page">
            <Breadcrumb items={["Lot stockage", "Nouveau"]} />
            <PageHeader
                eyebrow="Production"
                title="Ouvrir un stock"
                description="Associez un lot à un bassin et indiquez la date de début."
            />
            <StockForm initialLotId={typeof lot === "string" ? lot : undefined} />
        </div>
    );
}
