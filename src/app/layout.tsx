import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const display = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const SITE_URL = "https://tripos.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TripOS — Plan, Split, Settle & Relive Group Trips",
    template: "%s · TripOS",
  },
  description:
    "TripOS is an AI group travel workspace for planning itineraries, voting on decisions, splitting expenses, settling payments, and creating beautiful trip storybooks.",
  keywords: [
    "group travel",
    "trip planner",
    "expense splitter",
    "AI itinerary",
    "trip workspace",
    "travel storybook",
    "group trip planning",
    "settle expenses",
    "TripOS",
  ],
  authors: [{ name: "TripOS" }],
  openGraph: {
    title: "TripOS — Plan, Split, Settle & Relive Group Trips",
    description:
      "Stop planning group trips on WhatsApp. TripOS turns chats, receipts, and photos into one shared AI workspace.",
    url: SITE_URL,
    siteName: "TripOS",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "TripOS — Plan, Split, Settle & Relive Group Trips",
    description:
      "One shared AI workspace for group travel — itinerary, voting, ledger, settlement, and a beautiful trip storybook.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-bg text-fg flex flex-col selection:bg-cyan/30">
        {children}
      </body>
    </html>
  );
}
