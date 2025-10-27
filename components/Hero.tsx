import React from "react";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative h-screen flex items-center justify-center px-6 bg-[#FAFAFF] overflow-hidden"
    >
  {/* Background Nebula Lights */}
  <div className="absolute -top-32 -left-40 w-[700px] h-[700px] bg-gradient-to-br from-[#4DC3FF] to-[#7B61FF] opacity-20 blur-[160px] rounded-full z-0" />
  <div className="absolute bottom-[-150px] right-[-100px] w-[700px] h-[700px] bg-gradient-to-tr from-[#7B61FF] to-[#2E147E] opacity-30 blur-[160px] rounded-full z-0" />
  <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-transparent to-[#FDFDFF]/80 pointer-events-none" />


      <div className="relative z-10 max-w-4xl text-center space-y-8 pt-20">
        <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight text-primary">
          Unleash Your Digital Potential <br />
          with{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#634cd3] to-[#2e147e]">
            Galuxium AI
          </span>
        </h1>
        <p className="text-xl text-gray-600 font-medium">
          The ultimate AI-powered platform for creators, marketers, and businesses. <br className="hidden md:block" />
          Launch websites, craft content, build brands — with zero code.
        </p>

        <div className="flex justify-center gap-6 flex-wrap">
          <a
            href="/auth/signup"
            className="px-6 py-3 bg-gradient-to-r from-[#7B61FF] to-[#2e147e] text-white rounded-full font-semibold shadow-md hover:scale-95 duration-500 transition-all"
          >
            Start for Free
          </a>
          <a
            href="#features"
            className="px-6 py-3 border-2 border-[#7B61FF] text-[#2e147e] rounded-full hover:bg-white/10 transition-all font-semibold hover:scale-95 duration-500"
          >
            Explore Features
          </a>
        </div>
      </div>
    </section>
  );
}
