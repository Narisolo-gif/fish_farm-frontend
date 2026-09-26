import { useEffect, useState } from "react";

export function usePagination<T>(items: T[], pageSize = 10) {
	const [currentPage, setCurrentPage] = useState(1);
	const safePageSize = Math.max(1, pageSize);
	const totalPages = Math.max(1, Math.ceil(items.length / safePageSize));
	const visiblePage = Math.min(currentPage, totalPages);
	const startIndex = (visiblePage - 1) * safePageSize;

	useEffect(() => {
		if (currentPage !== visiblePage) {
			setCurrentPage(visiblePage);
		}
	}, [currentPage, visiblePage]);

	function goToPage(page: number) {
		setCurrentPage(Math.min(Math.max(1, page), totalPages));
	}

	return {
		items: items.slice(startIndex, startIndex + safePageSize),
		currentPage: visiblePage,
		totalPages,
		goToPage,
		startItem: items.length === 0 ? 0 : startIndex + 1,
		endItem: Math.min(startIndex + safePageSize, items.length),
	};
}
