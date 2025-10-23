"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FaCrown, FaCheckCircle, FaCreditCard, FaFileInvoice } from "react-icons/fa";

export default function SubscriptionsPage() {
  const currentPlan = "Pro"; // later fetch dynamically from backend

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2000c1]/10 to-[#2e147e]/10 px-10 py-12 text-[#1A1A1A]">
      {/* Page Heading */}
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-extrabold pb-2 bg-clip-text text-transparent bg-gradient-to-r from-[#2000c1] to-[#2e147e]">
          Manage Your Subscription
        </h1>
        <p className="text-lg text-gray-600 mt-3">
          View your current plan, explore upgrades, and manage billing.
        </p>
      </div>

      {/* Current Plan Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl p-8 shadow-xl border border-[#E5E7EB] mb-14 max-w-4xl mx-auto"
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <FaCrown size={40} className="text-yellow-500" />
            <div>
              <h2 className="text-2xl font-bold">Current Plan: {currentPlan}</h2>
              <p className="text-[#4B5563] mt-1">
                You’re enjoying all the benefits of the {currentPlan} plan.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Link href="/billing">
              <div className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#2000c1] to-[#2e147e] text-white font-semibold shadow-md hover:brightness-110 transition-all">
                Manage Billing
              </div>
            </Link>
            <Link href="/billing/history">
              <div className="px-5 py-3 rounded-xl bg-white border border-[#E5E7EB] text-gray-700 font-semibold shadow-md hover:bg-gray-50 transition-all">
                Billing History
              </div>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Upgrade Plans */}
      <h2 className="text-3xl font-bold text-center mb-10">Upgrade Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
        <PlanCard
          title="Core"
          price="₹299/month"
          features={["Basic AI Access", "Community Support", "Limited Usage"]}
        />
        <PlanCard
          title="Ultra"
          price="₹999/month"
          features={[
            "Unlimited AI Access",
            "Priority Support",
            "Access to Turbo Models",
          ]}
          highlight
        />
        <PlanCard
          title="Turbo"
          price="₹1999/month"
          features={[
            "All Ultra Features",
            "Enterprise-grade Usage",
            "Early Access to New Models",
          ]}
          highlight
        />
      </div>

      {/* Billing Tools */}
      <div className="max-w-5xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-2 gap-8">
        <BillingCard
          icon={<FaCreditCard size={28} className="text-green-600" />}
          title="Payment Methods"
          description="Add or update your credit/debit cards for faster payments."
          link="/billing/methods"
          buttonLabel="Manage Payment"
        />
        <BillingCard
          icon={<FaFileInvoice size={28} className="text-indigo-600" />}
          title="Invoices"
          description="Download all your past invoices for record keeping."
          link="/billing/history"
          buttonLabel="View Invoices"
        />
      </div>
    </div>
  );
}

const PlanCard = ({
  title,
  price,
  features,
  highlight,
}: {
  title: string;
  price: string;
  features: string[];
  highlight?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.15 }}
    className={`rounded-3xl p-8 shadow-xl flex flex-col border ${
      highlight
        ? "border-[#2000c1] bg-gradient-to-br from-[#ffffff] to-[#f9f9ff]"
        : "border-[#E5E7EB] bg-white"
    }`}
  >
    <h3 className="text-xl font-bold flex items-center gap-2">
      {title} {highlight && <FaCheckCircle className="text-[#2000c1]" />}
    </h3>
    <p className="text-3xl font-extrabold mt-3">{price}</p>
    <ul className="mt-6 space-y-3 text-[#4B5563]">
      {features.map((feature, idx) => (
        <li key={idx} className="flex items-center gap-2">
          <FaCheckCircle className="text-green-500" /> {feature}
        </li>
      ))}
    </ul>
    <div className="mt-auto pt-8">
      <button className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#2000c1] to-[#2e147e] text-white font-semibold shadow-md hover:brightness-110 transition-all">
        Upgrade
      </button>
    </div>
  </motion.div>
);

const BillingCard = ({
  icon,
  title,
  description,
  link,
  buttonLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  buttonLabel: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="bg-white rounded-3xl p-6 shadow-xl border border-[#E5E7EB] flex flex-col justify-between"
  >
    <div className="flex items-center gap-4">
      {icon}
      <h3 className="text-xl font-semibold">{title}</h3>
    </div>
    <p className="text-[#4B5563] py-5">{description}</p>
    <Link href={link}>
      <div className="inline-block w-fit px-5 py-3 rounded-lg bg-gradient-to-r from-[#2000c1] to-[#2e147e] text-white text-sm font-semibold shadow-md hover:brightness-110 transition-all">
        {buttonLabel}
      </div>
    </Link>
  </motion.div>
);
