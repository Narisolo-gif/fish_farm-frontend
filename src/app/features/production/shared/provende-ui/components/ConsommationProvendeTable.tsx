import { DataTable } from "@/components/DataTable";
import type { ConsommationProvendeEntry } from "@/app/features/production/shared/provende-ui/types/provende.types";

export function ConsommationProvendeTable({
	entries,
}: {
	entries: ConsommationProvendeEntry[];
}) {
	return (
		<DataTable
			className="treatment-journal-table"
			headers={["Date", "Référence provende", "Consommation (g)"]}
			rows={entries.map((entry) => [
				new Date(`${entry.date}T00:00:00`).toLocaleDateString("fr-FR"),
				entry.reference,
				entry.consumptionGrams.toLocaleString("fr-FR"),
			])}
		/>
	);
}