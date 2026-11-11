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
	cancel: (
		<>
			<circle cx="12" cy="12" r="9" />
			<path d="M5.6 5.6l12.8 12.8" />
		</>
	),
};

export type ActionIconName = keyof typeof ICON_PATHS;

/** Icône SVG des boutons d'action des tableaux (décorative : le bouton porte l'aria-label). */
export function ActionIcon({ name }: { name: ActionIconName }) {
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
