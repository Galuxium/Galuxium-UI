"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-sm border-b border-Line">
      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">
        {/* Brand */}
        <h1
          className="text-2xl lg:text-3xl font-extrabold bg-clip-text text-transparent cursor-pointer brightness-125"
          onClick={() => router.push("/")}
          style={{
            backgroundImage: "linear-gradient(90deg, #634cd3, #2e147e)",
            backgroundSize: "200% 100%",
          }}
        >
          Galuxium
        </h1>

        {/* Navigation Links */}
        <div className="hidden md:flex space-x-12 text-black font-medium">
          {["Features", "About", "Pricing"].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase()}`}
              className="relative py-1 after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[3px] after:bg-gradient-to-r after:from-[#634cd3] after:to-[#2e147e] after:transition-all hover:after:w-full transition-colors"
            >
              {label}
            </a>
          ))}
        </div>

        {/* Action Button */}
        <div className="gap-6 flex items-center">
          <button
          onClick={() => router.push("/auth/signup")}
          className="px-5 py-2 bg-gradient-to-r from-[#7B61FF] to-[#2e147e] text-white rounded-lg font-semibold shadow-lg hover:scale-95 duration-500 transition"
        >
          Sign Up
        </button>
        <button
          onClick={() => router.push("/auth/login")}
          className=" px-5 py-2 border-2 border-[#7B61FF]  bg-clip-text text-transparent bg-gradient-to-r from-[#634cd3] to-[#2e147e]  rounded-lg font-semibold hover:scale-95 duration-500 shadow-lg transition"
        >
          Log In
        </button>
        </div>

        
      </div>

      {/* Gradient shift keyframes */}
      <style jsx global>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </nav>
  );
}
