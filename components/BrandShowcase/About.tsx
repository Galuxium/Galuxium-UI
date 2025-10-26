import {
  FaGem,
  FaBolt,
  FaLayerGroup,
  FaUsersCog,
} from "react-icons/fa";

export default function AboutGaluxium() {
  const highlights = [
    {
      icon: <FaGem className="text-4xl text-[#7B61FF]" />,
      title: "Crafted for Creators & Entrepreneurs",
      desc: "Galuxium empowers individuals, solopreneurs, and teams to launch AI-powered products and brands effortlessly — without code or complexity.",
    },
    {
      icon: <FaBolt className="text-4xl text-[#ffb300]" />,
      title: "AI at the Core",
      desc: "Leverages cutting-edge models like GPT, Stable Diffusion, Whisper, and open-source LLMs for content, design, and marketing automation.",
    },
    {
      icon: <FaLayerGroup className="text-4xl text-[#00d169]" />,
      title: "Modular & Scalable Architecture",
      desc: "Build your business with composable tools — from landing pages and blogs to personas, templates, and automation flows — all in one place.",
    },
    {
      icon: <FaUsersCog className="text-4xl text-[#2E147E]" />,
      title: "Ready for Teams & Agencies",
      desc: "Advanced collaboration, branded client portals, user roles, and white-labeling — made to scale with your vision.",
    },
  ];

  return (
    <section
      id="about"
      className="relative w-full bg-[#f6f6ff] text-gray-900 py-28 overflow-hidden"
    >
  {/* Top glow pulled upward to blend with Features */}
  <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[#7B61FF] via-[#634CD3] to-[#2E147E] opacity-25 blur-[140px] rounded-full z-0" />
  {/* Side glow subtly hints into Pricing */}
  <div className="absolute bottom-[-80px] right-[-60px] w-[400px] h-[400px] bg-gradient-to-tr from-[#4DC3FF] to-[#7B61FF] opacity-20 blur-[120px] rounded-full z-0" />
  <div className="absolute bottom-[-80px] left-[-60px] w-[400px] h-[400px] bg-gradient-to-tr from-[#4DC3FF] to-[#7B61FF] opacity-20 blur-[120px] rounded-full z-0" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-center mb-16 text-transparent bg-clip-text bg-gradient-to-r from-[#7B61FF] to-[#2E147E]">
          What Makes Galuxium Different
        </h2>

        <div className="grid md:grid-cols-2 gap-12">
          {highlights.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-100 p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
            >
              <div className="flex items-center gap-4 mb-4">
                {item.icon}
                <h3 className="text-lg font-semibold text-gray-900">
                  {item.title}
                </h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
