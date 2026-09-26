type ListSearchProps = {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	label?: string;
};

export function ListSearch({
	value,
	onChange,
	placeholder = "Rechercher...",
	label = "Rechercher dans la liste",
}: ListSearchProps) {
	return (
		<label className="list-search">
			<span aria-hidden="true">⌕</span>
			<input
				type="search"
				value={value}
				placeholder={placeholder}
				aria-label={label}
				onChange={(event) => onChange(event.target.value)}
			/>
		</label>
	);
}