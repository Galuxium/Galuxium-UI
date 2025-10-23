import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full bg-[#0B0F19] text-white border-t border-[#1F2937] pt-16 pb-10 relative overflow-hidden">


      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Top grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand + tagline */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image src="/Galuxium-Logo.png" alt="Galuxium Logo" width={40} height={40} />
              
              <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#634cd3] to-[#2e147e] brightness-125">
                Galuxium
              </h1>
            </div>
            <p className="text-[#A0AEC0] text-sm leading-relaxed">
              Build your digital empire with AI. One platform. Infinite creation. Fully powered by Galuxium Core.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Product</h3>
            <ul className="space-y-2 text-[#A0AEC0] text-sm">
              <li><Link href="#features">Features</Link></li>
              <li><Link href="#roadmap">Roadmap</Link></li>
              <li><Link href="#pricing">Pricing</Link></li>
              <li><Link href="/auth/signup">Start Free</Link></li>
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-2 text-[#A0AEC0] text-sm">
              <li><Link href="/about">About</Link></li>
              <li><Link href="/careers">Careers</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/blog">Blog</Link></li>
            </ul>
          </div>

          {/* Legal + socials */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Legal & Social</h3>
            <ul className="space-y-2 text-[#A0AEC0] text-sm">
              <li><Link href="/privacy-policy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
              <li className="flex gap-3 mt-4">
                <a href="https://twitter.com/" target="_blank" rel="noreferrer">
                  <Image src="/x.svg" width={24} height={24} alt="X/Twitter" />
                </a>
                <a href="https://linkedin.com/" target="_blank" rel="noreferrer">
                  <Image src="/linkedin.svg" width={24} height={24} alt="LinkedIn" />
                </a>
                <a href="https://instagram.com/" target="_blank" rel="noreferrer">
                  <Image src="/insta.svg" width={24} height={24} alt="Instagram" />
                </a>
                <a href="https://facebook.com/" target="_blank" rel="noreferrer">
                  <Image src="/facebook.svg" width={24} height={24} alt="Facebook" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#1F2937] pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-[#6B7280]">
          <p>© {new Date().getFullYear()} Galuxium Technologies Inc. All rights reserved.</p>
          <p className="mt-4 md:mt-0">
            Built by Galuxium Team.
          </p>
        </div>
      </div>
    </footer>
  );
}
