import { Navbar } from "@/components/landing/Navbar";
import { PricingSection } from "@/components/landing/PricingSection";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Pricing",
  description: "Free for one-off trips. ₹99 per trip for Pro features and the Trip Capsule.",
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <PricingSection />
      </main>
      <Footer />
    </>
  );
}
