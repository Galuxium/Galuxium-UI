"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import Loading from "@/components/Loading";

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const name = params.get("Name") ?? "";
  const username = params.get("Username") ?? "";
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) router.replace("/auth/signup");
  }, [email, router]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

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

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) return;
    setVerifying(true);
    setError("");

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (error || !data?.session) {
      setError("Invalid or expired code. Please try again.");
      setVerifying(false);
      return;
    }

    const user = data.session.user;
    await supabase.from("users").upsert({
      id: user.id,
      email: user.email,
      name: name,
      username: username,
    });

    router.replace("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center relative overflow-hidden px-4">
      {/* Soft Glow Backgrounds */}
      <div className="absolute -top-32 -left-24 w-[600px] h-[600px] bg-gradient-to-br from-indigo-300 to-purple-200 opacity-30 blur-[120px] rounded-full z-0" />
      <div className="absolute bottom-[-80px] right-[-40px] w-[500px] h-[500px] bg-gradient-to-tr from-[#C4B5FD] to-[#E0E7FF] opacity-20 blur-[100px] rounded-full z-0" />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 bg-white/90 backdrop-blur-lg p-10 rounded-3xl shadow-2xl border border-gray-200 w-full max-w-md"
      >
        <div className="text-center mb-6">
          <h2 className="text-3xl pb-1 font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#7B61FF] to-[#2e147e]">
            Verify Your Email
          </h2>
          <p className="text-gray-600 text-sm mt-2 py-3">
            Enter the 6-digit code sent to{" "}
            <span className="text-gray-800 font-medium">{email}</span>
          </p>
        </div>

        <div className="flex justify-between gap-2 mb-8 py-5">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-2xl text-gray-800 text-center bg-white border border-gray-300 rounded-xl transition focus:outline-none focus:ring-2 focus:ring-[#7B61FF] shadow-sm"
            />
          ))}
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center mb-4">{error}</div>
        )}

        <button
          onClick={handleVerify}
          disabled={verifying || otp.some((d) => d === "")}
          className="w-full py-3 text-lg font-bold text-white rounded-xl bg-gradient-to-br from-[#7B61FF] to-[#2e147e] hover:brightness-110 hover:scale-105 transition-all duration-300"
        >
          {verifying ? "Verifying..." : "Verify and Continue"}
        </button>

        <p className="mt-10 text-center text-sm text-gray-500">
          Didn’t get the code?{" "}
          <span
            className="cursor-pointer font-semibold text-indigo-600 hover:underline"
            onClick={handleOTPLogin}
          >
            Resend
          </span>
        </p>
      </motion.div>
    </div>
  );
}
