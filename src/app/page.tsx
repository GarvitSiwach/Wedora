"use client";

import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Philosophy } from "@/components/Philosophy";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { ClosingCta } from "@/components/ClosingCta";
import { Footer } from "@/components/Footer";

export default function LandingPage() {
  const router = useRouter();

  const handleStartWedding = () => {
    router.push("/signup");
  };

  const handleSignIn = () => {
    router.push("/login");
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[var(--color-background)] selection:bg-[var(--color-champagne)]">
      {/* Responsive Navigation */}
      <Navbar
        onStartClick={handleStartWedding}
        onSignInClick={handleSignIn}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero onStartClick={handleStartWedding} />

        {/* Philosophy Section */}
        <Philosophy />

        {/* Features Overview */}
        <Features />

        {/* How It Works Journey */}
        <HowItWorks />

        {/* Closing Call to Action */}
        <ClosingCta onStartClick={handleStartWedding} />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
