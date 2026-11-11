"use client";

import Link from "next/link";
import { useState } from "react";
import { ActionIcon } from "@/components/ActionIcon";
import { DetailIconLink } from "@/components/DetailIconLink";
import { cloturerLot, deleteLot } from "@/app/features/production/lots/services/lotApi";
import {
	canCloseLot,
	canDeleteLot,
	canEditLot,
	type LotRecord,
} from "@/app/features/production/lots/types/lot.types";

/** Seule action de la colonne « Actions » de l'historique : la gestion du lot se fait depuis le détail. */
export function LotDetailLink({ lot }: { lot: Pick<LotRecord, "id" | "reference"> }) {
	return <DetailIconLink href={`/production/lots/${lot.id}`} label={`Voir le détail du lot ${lot.reference}`} />;
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
