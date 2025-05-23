"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FiMail, FiLock, FiUser } from "react-icons/fi";
import toast from "react-hot-toast";
import Link from "next/link";

const passwordRequirements = [
	{ regex: /.{8,}/, label: "At least 8 characters" },
	{ regex: /[A-Z]/, label: "One uppercase letter" },
	{ regex: /[a-z]/, label: "One lowercase letter" },
	{ regex: /[0-9]/, label: "One number" },
	{ regex: /[^A-Za-z0-9]/, label: "One special character" },
];

function validatePassword(password: string) {
	return passwordRequirements.every((req) => req.regex.test(password));
}

export default function RegisterPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [fullName, setFullName] = useState("");
	const [loading, setLoading] = useState(false);

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validatePassword(password)) {
			toast.error("Password does not meet requirements.");
			return;
		}
		setLoading(true);
		try {
			const { error } = await supabase.auth.signUp({
				email,
				password,
				options: { data: { full_name: fullName } },
			});
			if (error) {
				toast.error(error.message);
				//console.error("Register error:", error);
			} else {
				toast.success(
					"Registration successful! Please check your email to confirm."
				);
			}
		} catch (err) {
			toast.error("Unexpected error. Check //console.");
			//console.error("Unexpected register error:", err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<form
				onSubmit={handleRegister}
				className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md flex flex-col gap-6"
			>
				<h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
					Register for Periskope
				</h1>
				<div className="flex flex-col gap-4">
					<label className="flex items-center gap-2 border rounded px-3 py-2 bg-gray-100">
						<FiUser className="text-gray-400" />
						<input
							type="text"
							placeholder="Full Name"
							value={fullName}
							onChange={(e) => setFullName(e.target.value)}
							required
							className="bg-transparent outline-none flex-1 text-gray-900"
						/>
					</label>
					<label className="flex items-center gap-2 border rounded px-3 py-2 bg-gray-100">
						<FiMail className="text-gray-400" />
						<input
							type="email"
							placeholder="Email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="bg-transparent outline-none flex-1 text-gray-900"
						/>
					</label>
					<label className="flex items-center gap-2 border rounded px-3 py-2 bg-gray-100">
						<FiLock className="text-gray-400" />
						<input
							type="password"
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="bg-transparent outline-none flex-1 text-gray-900"
						/>
					</label>
				</div>
				<div className="text-xs text-gray-500 mb-2">
					<div>Password must contain:</div>
					<ul className="list-disc ml-5">
						{passwordRequirements.map((req) => (
							<li
								key={req.label}
								className={
									req.regex.test(password)
										? "text-green-600"
										: "text-red-500"
								}
							>
								{req.label}
							</li>
						))}
					</ul>
				</div>
				<button
					type="submit"
					disabled={loading}
					className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition disabled:opacity-60"
				>
					{loading ? "Registering..." : "Register"}
				</button>
				<div className="text-center mt-4 text-sm text-gray-500">
					Already have an account?{" "}
					<Link
						href="/login"
						className="text-blue-600 hover:underline"
					>
						Login
					</Link>
				</div>
			</form>
		</div>
	);
}