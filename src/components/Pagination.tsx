type PaginationProps = {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	startItem: number;
	endItem: number;
	onPageChange: (page: number) => void;
};

export function Pagination({
	currentPage,
	totalPages,
	totalItems,
	startItem,
	endItem,
	onPageChange,
}: PaginationProps) {
	if (totalItems === 0) return null;

	return (
		<nav className="list-pagination" aria-label="Pagination de la liste">
			<p aria-live="polite">
				Affichage de {startItem} à {endItem} sur {totalItems}
			</p>
			<div className="pagination-controls">
				<button
					type="button"
					className="button button-ghost pagination-button"
					disabled={currentPage <= 1}
					onClick={() => onPageChange(currentPage - 1)}
				>
					Précédent
				</button>
				<span>Page {currentPage} sur {totalPages}</span>
				<button
					type="button"
					className="button button-ghost pagination-button"
					disabled={currentPage >= totalPages}
					onClick={() => onPageChange(currentPage + 1)}
				>
					Suivant
				</button>
			</div>
		</nav>
	);
}