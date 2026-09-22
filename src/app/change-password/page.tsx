"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/apiClient";

const passwordRules = [
	{
		label: "8 caractères minimum",
		valid: (password: string) => password.length >= 8,
	},
	{
		label: "Une lettre majuscule",
		valid: (password: string) => /[A-Z]/.test(password),
	},
	{
		label: "Une lettre minuscule",
		valid: (password: string) => /[a-z]/.test(password),
	},
	{
		label: "Un chiffre",
		valid: (password: string) => /\d/.test(password),
	},
	{
		label: "Un caractère spécial",
		valid: (password: string) => /[^A-Za-z0-9]/.test(password),
	},
];

export default function ChangePasswordPage() {
	const router = useRouter();
	const [showOldPassword, setShowOldPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [oldPassword, setOldPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);

	const validationResults = passwordRules.map((rule) => ({
		...rule,
		isValid: rule.valid(newPassword),
	}));
	const passwordIsValid = validationResults.every((rule) => rule.isValid);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		setSuccess("");

		if (!passwordIsValid) {
			setError("Le nouveau mot de passe ne respecte pas les règles demandées.");
			return;
		}

		const accessToken = localStorage.getItem("access_token");
		if (!accessToken) {
			setError("Votre session a expiré. Veuillez vous reconnecter.");
			return;
		}

		setLoading(true);

		try {
			await apiRequest("/api/users/change-password/", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify({
					ancien_mot_de_passe: oldPassword,
					nouveau_mot_de_passe: newPassword,
				}),
			});

			setSuccess("Votre mot de passe a été modifié avec succès.");
			setOldPassword("");
			setNewPassword("");
			setTimeout(() => router.push("/login"), 1200);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Impossible de modifier le mot de passe.",
			);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="login-page">
			<form className="login-card" onSubmit={handleSubmit}>
				<div className="logo-box">Fish Farm Anosy</div>

				<h1>Changer le mot de passe</h1>
				<p>Choisissez un nouveau mot de passe pour sécuriser votre compte.</p>

				<label>
					Ancien mot de passe
					<span className="password-field">
						<input
							type={showOldPassword ? "text" : "password"}
							value={oldPassword}
							onChange={(event) => setOldPassword(event.target.value)}
							required
						/>
						<button
							type="button"
							className="password-toggle"
							aria-label={showOldPassword ? "Masquer l'ancien mot de passe" : "Afficher l'ancien mot de passe"}
							onClick={() => setShowOldPassword((visible) => !visible)}
						>
							{showOldPassword ? "Masquer" : "Afficher"}
						</button>
					</span>
				</label>

				<label>
					Nouveau mot de passe
					<span className="password-field">
						<input
							type={showNewPassword ? "text" : "password"}
							value={newPassword}
							onChange={(event) => setNewPassword(event.target.value)}
							required
							aria-describedby="password-rules"
						/>
						<button
							type="button"
							className="password-toggle"
							aria-label={showNewPassword ? "Masquer le nouveau mot de passe" : "Afficher le nouveau mot de passe"}
							onClick={() => setShowNewPassword((visible) => !visible)}
						>
							{showNewPassword ? "Masquer" : "Afficher"}
						</button>
					</span>
				</label>

				<ul className="password-validation" id="password-rules" aria-live="polite">
					{validationResults.map((rule) => (
						<li className={newPassword && rule.isValid ? "is-valid" : newPassword ? "is-invalid" : ""} key={rule.label}>
							<span aria-hidden="true">{newPassword && rule.isValid ? "✓" : "•"}</span>
							{rule.label}
						</li>
					))}
				</ul>

				{error && <p className="form-error" role="alert">{error}</p>}
				{success && <p className="form-success" role="status">{success}</p>}

				<button className="button button-primary" type="submit" disabled={loading || !passwordIsValid}>
					{loading ? "Modification..." : "Modifier le mot de passe"}
				</button>

				<Link className="back-link" href="/login">Retour à la connexion</Link>
			</form>
		</div>
	);
}
