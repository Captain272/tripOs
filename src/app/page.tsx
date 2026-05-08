/**
 * TripOS — Landing page (root route)
 *
 * Section composition reflects the user-facing narrative:
 *  1. Hero            — pitch + dashboard mockup
 *  2. Problem         — what breaks today
 *  3. Lifecycle       — Before / During / After
 *  4. ProductTabs     — Plan / Vote / Budget / Ledger / Settle / Memories
 *  5. AiParserDemo    — chat → structured cards
 *  6. TripLedger      — money layer for travel
 *  7. TripStorybook   — Trip Capsule + Wrapped stats
 *  8. UseCases        — who it's for
 *  9. PartnerSection  — partners + form
 * 10. ViralLoop       — every trip creates the next
 * 11. Comparison      — TripOS vs single-purpose tools
 * 12. Pricing
 * 13. Vision          — YC narrative + pyramid
 * 14. Waitlist        — primary signup form
 * 15. FinalCTA + Footer
 */

import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { LifecycleSection } from "@/components/landing/LifecycleSection";
import { ProductTabs } from "@/components/landing/ProductTabs";
import { AiParserDemo } from "@/components/landing/AiParserDemo";
import { TripLedger } from "@/components/landing/TripLedger";
import { TripStorybook } from "@/components/landing/TripStorybook";
import { UseCases } from "@/components/landing/UseCases";
import { PartnerSection } from "@/components/landing/PartnerSection";
import { ViralLoop } from "@/components/landing/ViralLoop";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { VisionSection } from "@/components/landing/VisionSection";
import { WaitlistSection } from "@/components/landing/WaitlistSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { ToastProvider } from "@/components/ui/Toast";
import { ScrollProgress } from "@/components/ui/ScrollProgress";

export default function Home() {
  return (
    <ToastProvider>
      <a href="#main" className="skip-to-content">
        Skip to main content
      </a>
      <ScrollProgress />
      <Navbar />
      <main id="main" className="relative flex-1">
        <Hero />
        <ProblemSection />
        <LifecycleSection />
        <ProductTabs />
        <AiParserDemo />
        <TripLedger />
        <TripStorybook />
        <UseCases />
        <PartnerSection />
        <ViralLoop />
        <ComparisonSection />
        <PricingSection />
        <VisionSection />
        <WaitlistSection />
        <FinalCTA />
      </main>
      <Footer />
    </ToastProvider>
  );
}
