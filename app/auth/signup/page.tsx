"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FaArrowLeft, FaGithub, FaGoogle, FaUserAlt } from "react-icons/fa";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignup = async () => {
    setLoading(true);
    setError("");

    const { email, name, username } = form;

    if (!email || !name || !username) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        data: { name: name, username: username },
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(
        `/auth/verify-email?email=${encodeURIComponent(email)}&nameame=${encodeURIComponent(name)}&username=${encodeURIComponent(username)}`
      );
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center relative overflow-hidden">
      {/* 🌤 Premium Light Gradients */}
      <div className="absolute -top-24 -left-32 w-[600px] h-[600px] bg-gradient-to-br from-[#D8B4FE] to-[#C7D2FE] opacity-40 blur-[120px] rounded-full z-0" />
      <div className="absolute bottom-[-80px] right-[-40px] w-[500px] h-[500px] bg-gradient-to-tr from-[#A5B4FC] to-[#E0E7FF] opacity-20 blur-[100px] rounded-full z-0" />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-200 w-full max-w-md"
      >
        <div className="relative z-10 pt-10 px-10 pb-5 rounded-3xl w-full max-w-md">
          <Link
            href="/"
            className="absolute left-6 top-6 p-2 rounded-full bg-white border shadow hover:scale-105 transition"
          >
            <FaArrowLeft className="text-gray-700" />
          </Link>

          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-[#7B61FF] to-[#2e147e] rounded-full shadow-xl">
              <FaUserAlt className="text-2xl text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-2">
            Create your{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#7B61FF] to-[#2e147e]">
              Account
            </span>
             
          </h2>
          <p className="text-center text-gray-500 text-sm mb-6">
            Welcome! Please fill in the details to get started.
          </p>

          <div className="flex gap-3 mb-4">
            <button
              onClick={() => handleOAuth("google")}
              className="flex-1 py-2 border border-gray-300 rounded-lg flex justify-center bg-white items-center gap-2 text-sm font-medium hover:bg-gray-50 transition"
            >
              <FaGoogle /> Google
            </button>
            <button
              onClick={() => handleOAuth("github")}
              className="flex-1 py-2 border border-gray-300 rounded-lg flex justify-center bg-white items-center gap-2 text-sm font-medium hover:bg-gray-50 transition"
            >
              <FaGithub /> GitHub
            </button>
          </div>

          <div className="flex items-center gap-2 my-4">
            <div className="h-px bg-gray-300 flex-1" />
            <span className="text-xs text-gray-400">or</span>
            <div className="h-px bg-gray-300 flex-1" />
          </div>

          <div className="grid grid-cols-[55%_41%] gap-3 mb-3">
            <input
              placeholder="Name"
              className="px-3 py-2 border rounded-lg text-sm text-gray-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
            <input
              placeholder="Username"
              className="px-3 py-2 border rounded-lg text-sm text-gray-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={form.username}
              onChange={(e) => handleChange("username", e.target.value)}
            />
          </div>

          <input
            placeholder="Email address"
            type="email"
            className="w-full px-3 py-2 border rounded-lg text-sm mb-3 text-gray-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />

          {error && (
            <p className="text-sm text-red-500 text-center mb-3">{error}</p>
          )}

          <button
            onClick={handleSignup}
            disabled={loading}
            className="mt-4 w-full py-3 text-lg font-bold text-white rounded-xl bg-gradient-to-br from-[#7B61FF] to-[#2e147e] hover:brightness-110 hover:scale-95 transition-all duration-300"
          >
            {loading ? "Sending OTP..." : "Continue"}
          </button>

          <p className="mt-5 text-sm text-center text-gray-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-indigo-600 font-medium">
              Sign in
            </Link>
          </p>
        </div>

        
      </motion.div>
    </div>
  );
}
