import React from "react";
import {
  FaPenNib,
  FaPalette,
  FaGlobe,
  FaChartLine,
  FaRobot,
  FaPuzzlePiece,
} from "react-icons/fa";

export default function Features() {
  const features = [
    {
      title: "AI Content Studio",
      desc: "Create SEO-optimized blogs, emails, and marketing copy in seconds — fine-tuned for your tone, goals, and audience.",
      icon: <FaPenNib className="text-4xl text-sky-400" />,
    },
    {
      title: "Visual Design Suite",
      desc: "Generate logos, social media graphics, brand kits, and video snippets — all within a pixel-perfect AI canvas.",
      icon: <FaPalette className="text-4xl text-amber-400" />,
    },
    {
      title: "Instant Website Builder",
      desc: "Go live in minutes with responsive layouts, integrated domains, and smart content blocks powered by LLMs.",
      icon: <FaGlobe className="text-4xl text-emerald-400" />,
    },
    {
      title: "AI-Powered Marketing",
      desc: "Launch campaigns, automate newsletters, analyze engagement — all with AI-crafted strategies and assets.",
      icon: <FaChartLine className="text-4xl text-rose-400" />,
    },
    {
      title: "Open & Extendable AI Engine",
      desc: "Built on top of GPT-4, LLaMA, and Claude — with full control over model selection, prompt tuning, and output.",
      icon: <FaRobot className="text-4xl text-purple-700" />,
    },
    {
      title: "Creator Marketplace",
      desc: "Monetize templates, themes, workflows, and tools in the community-driven Galuxium marketplace.",
      icon: <FaPuzzlePiece className="text-4xl text-pink-400" />,
    },
  ];

  return (
    <section
      id="features"
      className="relative w-full py-24 bg-[#FDFDFF] overflow-hidden"
    >
  {/* Top glow overlaps bottom of Hero */}
  <div className="absolute -top-40 right-[-100px] w-[700px] h-[700px] bg-gradient-to-br from-[#7B61FF] via-[#634CD3] to-[#2E147E] opacity-25 blur-[140px] rounded-full z-0" />
  {/* Bottom glow softly touches About */}
  <div className="absolute bottom-[-120px] left-[-80px] w-[500px] h-[500px] bg-gradient-to-tr from-purple-800 via-indigo-600 to-transparent opacity-20 blur-[140px] rounded-full z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-center mb-12 pb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-800">
          Everything You Need to Build with AI
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-3xl p-8 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
            >
              <div className="mb-6">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
