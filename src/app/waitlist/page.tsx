import { Navbar } from "@/components/landing/Navbar";
import { WaitlistSection } from "@/components/landing/WaitlistSection";
import { Footer } from "@/components/landing/Footer";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata = {
  title: "Join the waitlist",
  description: "Founding members get free Pro Trip access. We're onboarding small batches every week.",
};

export default function WaitlistPage() {
  return (
    <ToastProvider>
      <Navbar />
      <main className="pt-20">
        <WaitlistSection />
      </main>
      <Footer />
    </ToastProvider>
  );
}
