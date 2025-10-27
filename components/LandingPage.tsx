import Navbar from "@/components/BrandShowcase/Navbar";
import Hero from "@/components/BrandShowcase/Hero";
import Features from "@/components/BrandShowcase/Features";
import Pricing from "@/components/BrandShowcase/Pricing";
import CTA from "@/components/BrandShowcase/Cta";
import Footer from "@/components/BrandShowcase/Footer";
import AboutGaluxium from "@/components/BrandShowcase/About";

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
