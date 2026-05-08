import { Navbar } from "@/components/landing/Navbar";
import { PartnerSection } from "@/components/landing/PartnerSection";
import { Footer } from "@/components/landing/Footer";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata = {
  title: "Partners",
  description: "Hotels, homestays, cafes, and travel organizers — get in front of high-intent groups while they plan.",
};

export default function PartnersPage() {
  return (
    <ToastProvider>
      <Navbar />
      <main className="pt-20">
        <PartnerSection />
      </main>
      <Footer />
    </ToastProvider>
  );
}
