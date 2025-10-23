"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FaArrowLeft, FaGithub, FaGoogle, FaSignInAlt } from "react-icons/fa";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  const handleOTPLogin = async () => {
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
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
      {/* Premium Background Glow */}
      <div className="absolute -top-20 -left-32 w-[600px] h-[600px] bg-gradient-to-br from-[#C7D2FE] to-[#E0E7FF] opacity-40 blur-[120px] rounded-full z-0" />
      <div className="absolute bottom-[-60px] right-[-40px] w-[500px] h-[500px] bg-gradient-to-tr from-[#A5B4FC] to-[#D8B4FE] opacity-20 blur-[100px] rounded-full z-0" />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-200 w-full max-w-md"
      >
        <div className="relative z-10 pt-10 px-10 pb-6">
          {/* Back Button */}
          <Link
            href="/"
            className="absolute left-6 top-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition shadow"
          >
            <FaArrowLeft className="text-gray-600" />
          </Link>

          {/* Icon Header */}
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-[#7B61FF] to-[#2e147e] rounded-full shadow-xl">
              <FaSignInAlt className="text-2xl text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-2">
            Sign in to{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#7B61FF] to-[#2e147e]">
              Galuxium
            </span>
          </h2>

          <p className="text-center text-gray-500 text-sm mb-6">
            Welcome back! Please sign in to continue.
          </p>

          {/* OAuth Buttons */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => handleOAuth("google")}
              className="flex-1 py-2 border border-gray-300 rounded-lg flex justify-center items-center gap-2 text-sm font-medium bg-white hover:bg-gray-50 transition"
            >
              <FaGoogle /> Google
            </button>
            <button
              onClick={() => handleOAuth("github")}
              className="flex-1 py-2 border border-gray-300 rounded-lg flex justify-center items-center gap-2 text-sm font-medium bg-white hover:bg-gray-50 transition"
            >
              <FaGithub /> GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2 my-4">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-xs text-gray-400">or</span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>

          {/* Email Field */}
          <input
            placeholder="Email address"
            type="email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm mb-3 text-gray-700 bg-white placeholder-gray-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {error && (
            <p className="text-sm text-red-500 text-center mb-3">{error}</p>
          )}

          {/* Login Button */}
          <button
            onClick={handleOTPLogin}
            disabled={loading || !email}
            className="mt-4 w-full py-3 text-lg font-bold text-white rounded-xl bg-gradient-to-br from-[#7B61FF] to-[#2e147e] hover:brightness-110 hover:scale-95 transition-all duration-300"
          >
            {loading ? "Sending Code..." : "Log In"}
          </button>

          <p className="mt-5 text-sm text-center text-gray-500">
            {"Don't have an account?"}{" "}
            <Link
              href="/auth/signup"
              className="text-indigo-600  font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>

       
      </motion.div>
    </div>
  );
}
