import { demoTreatmentLots } from "@/lib/data";

export function LotSelector({
	value,
	onChange,
}: {
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<label>
			Lot
			<select value={value} onChange={(event) => onChange(event.target.value)} required>
				<option value="" disabled>Sélectionner un lot</option>
				{demoTreatmentLots.map((lot) => (
					<option key={lot.id} value={lot.id}>
						{lot.reference} · {lot.basin}
					</option>
				))}
			</select>
		</label>
	);
}