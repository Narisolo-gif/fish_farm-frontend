import Link from "next/link";
import { ActionIcon } from "@/components/ActionIcon";

/** Bouton icône « Voir le détail » utilisé dans la colonne Actions des historiques. */
export function DetailIconLink({ href, label }: { href: string; label: string }) {
	return (
		<Link className="button button-ghost icon-button" href={href} aria-label={label} title="Voir le détail">
			<ActionIcon name="detail" />
		</Link>
	);
}
