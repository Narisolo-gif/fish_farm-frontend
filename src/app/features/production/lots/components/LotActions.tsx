"use client";

import Link from "next/link";
import { useState } from "react";
import { cloturerLot, deleteLot } from "@/app/features/production/lots/services/lotApi";
import {
	canCloseLot,
	canDeleteLot,
	canEditLot,
	type LotRecord,
} from "@/app/features/production/lots/types/lot.types";

const ICON_PATHS = {
	detail: (
		<>
			<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
			<circle cx="12" cy="12" r="3" />
		</>
	),
	edit: (
		<>
			<path d="M12 20h9" />
			<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
		</>
	),
	close: (
		<>
			<rect x="4" y="11" width="16" height="10" rx="2" />
			<path d="M8 11V7a4 4 0 0 1 8 0v4" />
		</>
	),
	delete: (
		<>
			<path d="M3 6h18" />
			<path d="M8 6V4h8v2" />
			<path d="M19 6l-1 14H6L5 6" />
			<path d="M10 11v6M14 11v6" />
		</>
	),
};

function ActionIcon({ name }: { name: keyof typeof ICON_PATHS }) {
	return (
		<svg
			viewBox="0 0 24 24"
			width="16"
			height="16"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			focusable="false"
		>
			{ICON_PATHS[name]}
		</svg>
	);
}

/** Seule action de la colonne « Actions » de l'historique : la gestion du lot se fait depuis le détail. */
export function LotDetailLink({ lot }: { lot: Pick<LotRecord, "id" | "reference"> }) {
	return (
		<Link
			className="button button-ghost icon-button"
			href={`/production/lots/${lot.id}`}
			aria-label={`Voir le détail du lot ${lot.reference}`}
			title="Voir le détail"
		>
			<ActionIcon name="detail" />
		</Link>
	);
}

/** Actions de gestion affichées dans la page détail du lot. */
export function LotActions({
	lot,
	onClosed,
	onDeleted,
	onError,
}: {
	lot: LotRecord;
	onClosed: (lot: LotRecord) => void;
	onDeleted: (lot: LotRecord) => void;
	onError: (message: string) => void;
}) {
	const [isBusy, setIsBusy] = useState(false);

	async function handleClose() {
		if (!window.confirm(`Clôturer le lot ${lot.reference} ? Il ne pourra plus être modifié.`)) {
			return;
		}
		setIsBusy(true);
		try {
			const result = await cloturerLot(lot.id);
			onClosed({ ...lot, stade: result.stade });
		} catch (error) {
			onError(error instanceof Error ? error.message : "Impossible de clôturer ce lot.");
		} finally {
			setIsBusy(false);
		}
	}

	async function handleDelete() {
		if (!window.confirm(`Supprimer définitivement le lot ${lot.reference} ?`)) {
			return;
		}
		setIsBusy(true);
		try {
			await deleteLot(lot.id);
			onDeleted(lot);
		} catch (error) {
			onError(error instanceof Error ? error.message : "Impossible de supprimer ce lot.");
			setIsBusy(false);
		}
	}

	return (
		<div className="lot-actions">
			{canEditLot(lot) && (
				<Link
					className="button button-ghost icon-button"
					href={`/production/lots/${lot.id}/modifier`}
					aria-label={`Modifier le lot ${lot.reference}`}
					title="Modifier"
				>
					<ActionIcon name="edit" />
				</Link>
			)}
			{canCloseLot(lot) && (
				<button
					type="button"
					className="button button-ghost icon-button"
					onClick={() => void handleClose()}
					disabled={isBusy}
					aria-label={`Clôturer le lot ${lot.reference}`}
					title="Clôturer"
				>
					<ActionIcon name="close" />
				</button>
			)}
			{canDeleteLot(lot) && (
				<button
					type="button"
					className="button button-danger icon-button"
					onClick={() => void handleDelete()}
					disabled={isBusy}
					aria-label={`Supprimer le lot ${lot.reference}`}
					title="Supprimer"
				>
					<ActionIcon name="delete" />
				</button>
			)}
		</div>
	);
}
