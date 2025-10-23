import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import CTA from "@/components/Cta";
import Footer from "@/components/Footer";
import AboutGaluxium from "@/components/About";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0A0E1F] text-white antialiased overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <AboutGaluxium/>
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
