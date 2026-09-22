"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/apiClient";

type LoginResponse = {
	access: string;
	refresh: string;
};

export default function LoginPage() {
	const router = useRouter();

	const [showPassword, setShowPassword] = useState(false);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		setError("");
		setLoading(true);

		try {
			const data = await apiRequest<LoginResponse>(
				"/api/auth/login/",
				{
					method: "POST",
					body: JSON.stringify({
						username,
						password,
					}),
				},
			);

			localStorage.setItem("access_token", data.access);
			localStorage.setItem("refresh_token", data.refresh);

			const user = await apiRequest<{
				id: number;
				username: string;
				role: {
					id: number;
					libelle: string;
				};
				must_change_password: boolean;
			}>("/api/auth/me/", {
				headers: {
					Authorization: `Bearer ${data.access}`,
				},
			});

			if (user.must_change_password) {
				router.push("/change-password");
			} else if (user.role?.libelle === "Administrateur") {
				router.push("/admin");
			} else {
				router.push("/production");
			}
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Identifiants incorrects.",
			);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="login-page">
			<form className="login-card" onSubmit={handleSubmit}>
				<div className="logo-box">Fish Farm Anosy</div>

				<h1>Bonjour !</h1>

				<p>
					Connectez-vous à votre espace de pilotage.
				</p>

				<label>
					Username
					<input
						type="text"
						placeholder="Votre nom d'utilisateur"
						value={username}
						onChange={(event) =>
							setUsername(event.target.value)
						}
						required
					/>
				</label>

				<label>
					Mot de passe

					<span className="password-field">
						<input
							type={
								showPassword
									? "text"
									: "password"
							}
							placeholder="••••••••"
							value={password}
							onChange={(event) =>
								setPassword(event.target.value)
							}
							required
						/>

						<button
							type="button"
							className="password-toggle"
							aria-label={
								showPassword
									? "Masquer le mot de passe"
									: "Afficher le mot de passe"
							}
							onClick={() =>
								setShowPassword(
									(visible) => !visible,
								)
							}
						>
							{showPassword
								? "Masquer"
								: "Afficher"}
						</button>
					</span>
				</label>

				{error && (
					<p className="login-error">
						{error}
					</p>
				)}

				<button
					className="button button-primary"
					type="submit"
					disabled={loading}
				>
					{loading
						? "Connexion..."
						: "Se connecter"}
				</button>
			</form>
		</div>
	);
}