"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FiMail, FiLock } from "react-icons/fi";
import toast from "react-hot-toast";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error(error.message);
        console.error("Login error:", error);
      } else {
        toast.success("Logged in successfully!");
        window.location.href = "/chats";
      }
    } catch (err) {
      toast.error("Unexpected error. Check console.");
      console.error("Unexpected login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <form
        onSubmit={handleLogin}
        className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 w-full max-w-md flex flex-col gap-6"
      >
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">
          Login to Periskope
        </h1>
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-2 border rounded px-3 py-2 bg-gray-100 dark:bg-gray-700">
            <FiMail className="text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="bg-transparent outline-none flex-1 text-gray-900 dark:text-gray-100"
            />
          </label>
          <label className="flex items-center gap-2 border rounded px-3 py-2 bg-gray-100 dark:bg-gray-700">
            <FiLock className="text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="bg-transparent outline-none flex-1 text-gray-900 dark:text-gray-100"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <div className="text-center mt-4 text-sm text-gray-500">
          New here? <Link href="/register" className="text-blue-600 hover:underline">Register</Link>
        </div>
      </form>
    </div>
  );
} 