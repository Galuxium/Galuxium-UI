import React from "react";

export default function CTA() {
  return (
    <section className="relative w-full py-24 bg-white overflow-hidden">
  {/* Light background gradient, soft to footer */}
  <div className="absolute inset-0 bg-gradient-to-br from-[#F3F4F6] via-[#FAFAFA] to-white opacity-90 pointer-events-none" />
  <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#C4B5FD] blur-3xl opacity-20 rounded-full" />
  <div className="absolute bottom-[-60px] left-[-60px] w-[300px] h-[300px] bg-[#A7F3D0] blur-3xl opacity-20 rounded-full" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
          Ready to Build with{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-700">
            Galuxium?
          </span>
        </h2>

        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
          Join thousands of creators, developers, and entrepreneurs building faster with the AI-powered suite built for the modern web.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-5">
          <a
            href="/auth/signup"
            className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:scale-105 hover:brightness-110 transition transform duration-300"
          >
            Get Started for Free
          </a>
        </div>
      </div>
    </section>
  );
}
