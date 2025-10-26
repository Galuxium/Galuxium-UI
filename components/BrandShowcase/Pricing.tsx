"use client";

import React, { useState } from "react";
import { FaCheckCircle } from "react-icons/fa";

export default function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const pricing = {
    monthly: [
      {
        name: "Free",
        price: "₹0",
        subtitle: "Get started with core features",
        features: [
          "AI content & image generation",
          "No-code website builder",
          "Community access",
          "Limited templates",
        ],
        popular: false,
      },
      {
        name: "Pro",
        price: "₹799",
        subtitle: "Best for creators & solopreneurs",
        features: [
          "Unlimited content creation",
          "Advanced AI personas",
          "Custom branding & domains",
          "Priority support",
        ],
        popular: true,
      },
      {
        name: "Agency",
        price: "₹2999",
        subtitle: "For teams & client work",
        features: [
          "Team collaboration tools",
          "Unlimited projects",
          "Client workspaces",
          "Dedicated success manager",
        ],
        popular: false,
      },
    ],
    yearly: [
      {
        name: "Free",
        price: "₹0",
        subtitle: "Get started with core features",
        features: [
          "AI content & image generation",
          "No-code website builder",
          "Community access",
          "Limited templates",
        ],
        popular: false,
      },
      {
        name: "Pro",
        price: "₹699/mo",
        subtitle: "Best for creators (billed yearly)",
        features: [
          "Unlimited content creation",
          "Advanced AI personas",
          "Custom branding & domains",
          "Priority support",
        ],
        popular: true,
      },
      {
        name: "Agency",
        price: "₹2499/mo",
        subtitle: "For growing teams (billed yearly)",
        features: [
          "Team collaboration tools",
          "Unlimited projects",
          "Client workspaces",
          "Dedicated success manager",
        ],
        popular: false,
      },
    ],
  };

  const plans = pricing[billing];

  return (
    <section id="pricing" className="relative bg-white text-gray-900 py-28">
  {/* Top glow connects to About bottom */}
  <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-[#7B61FF] via-[#634CD3] to-[#2E147E] opacity-25 blur-[140px] rounded-full z-0" />
  {/* Bottom glow continues softly into CTA */}
  <div className="absolute bottom-[-120px] left-[-60px] w-[500px] h-[500px] bg-gradient-to-tr from-purple-800 via-indigo-600 to-transparent opacity-20 blur-[140px] rounded-full z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-4xl sm:text-5xl font-extrabold pb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-700">
          Simple Pricing for Everyone
        </h2>
        <p className="text-gray-600 text-lg mb-12">
          Start for free. Upgrade anytime as you grow.
        </p>

        {/* Billing toggle */}
        <div className="flex justify-center mb-16">
          <div className="inline-flex bg-gray-100 border border-gray-200 rounded-full p-1 text-sm font-semibold shadow-sm">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-6 py-2 rounded-full transition ${
                billing === "monthly"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-700 text-white shadow-md"
                  : "text-gray-500"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-6 py-2 rounded-full transition ${
                billing === "yearly"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-700 text-white shadow-md"
                  : "text-gray-500"
              }`}
            >
              Yearly <span className="hidden sm:inline">(2 months free)</span>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative bg-white border border-gray-200 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 ${
                plan.popular && "ring-2 ring-indigo-400 scale-[1.03]"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-indigo-500 to-purple-700 text-xs font-bold text-white px-3 py-1 rounded-full shadow">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-semibold mb-2">{plan.name}</h3>
              <p className="text-3xl font-extrabold mb-2">{plan.price}</p>
              <p className="text-sm text-gray-500 mb-6">{plan.subtitle}</p>

              <ul className="text-left space-y-4 mb-8">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-2 text-gray-600">
                    <FaCheckCircle className="text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button className="w-full bg-gradient-to-r from-indigo-500 to-purple-700 text-white font-semibold py-3 rounded-full hover:brightness-110 transition">
                {plan.name === "Free" ? "Get Started" : "Upgrade Now"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
