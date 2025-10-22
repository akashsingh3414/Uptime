"use client"

import React from "react";
import { useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";

function App() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();

  const handleStartMonitoring = () => {
    if (isSignedIn) {
      router.push("/dashboard");
    } else {
      openSignIn({ afterSignInUrl: "/dashboard" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-white transition-colors duration-200">

      <section className="max-w-6xl mx-auto px-6 py-20 md:flex md:items-center md:justify-between">
        <div className="md:w-1/2">
          <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
            Reliable Uptime Monitoring
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Monitor your websites and services in real-time. Get instant alerts when downtime occurs and keep your business running smoothly.
          </p>
          <button
            onClick={handleStartMonitoring}
            className="flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
        <div className="md:w-1/2 mt-10 md:mt-0">
          <img
            src="/homepage.png"
            alt="Dashboard"
            className="rounded-xl shadow-lg"
          />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <h3 className="text-3xl font-bold text-center mb-16 text-gray-900 dark:text-white">
          Key Features
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            title="Instant Alerts"
            description="Get notifications immediately when your services experience downtime."
          />
          <FeatureCard
            title="24/7 Monitoring"
            description="Continuous monitoring from multiple locations worldwide."
          />
          <FeatureCard
            title="Performance Reports"
            description="Analyze uptime trends and performance metrics over time."
          />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <h3 className="text-3xl font-bold text-center mb-16 text-gray-900 dark:text-white">
          Simple Pricing
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <PricingCard
            title="Starter"
            price="$29/mo"
            features={["10 monitors", "1-min checks", "Email alerts", "5 team members"]}
          />
          <PricingCard
            title="Professional"
            price="$79/mo"
            features={["50 monitors", "30-sec checks", "All alerts", "Unlimited team members", "API access"]}
            featured
          />
          <PricingCard
            title="Enterprise"
            price="$199/mo"
            features={["Unlimited monitors", "15-sec checks", "Priority support", "Custom solutions"]}
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition">
      <h4 className="font-semibold text-xl mb-2 text-gray-900 dark:text-white">{title}</h4>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}

function PricingCard({ title, price, features, featured = false }: { title: string; price: string; features: string[]; featured?: boolean }) {
  return (
    <div className={`p-8 rounded-lg border ${featured ? "border-black dark:border-white bg-black text-white" : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"} transition`}>
      <h4 className="font-semibold text-2xl mb-4">{title}</h4>
      <p className="text-3xl font-bold mb-6">{price}</p>
      <ul className="space-y-2 mb-6">
        {features.map((f, idx) => <li key={idx}>• {f}</li>)}
      </ul>
      <button className={`w-full py-3 rounded-lg ${featured ? "bg-white text-black hover:bg-gray-200 dark:hover:bg-gray-700" : "bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"} transition`}>
        Choose Plan
      </button>
    </div>
  );
}

export default App;
