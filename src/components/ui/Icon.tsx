import * as React from "react";
import {
  MessageCircle,
  Vote,
  Wallet,
  Receipt,
  Handshake,
  Map as MapIcon,
  Calendar,
  Sparkles,
  Users,
  Camera,
  Route,
  Compass,
  Gauge,
  ScanLine,
  BookOpen,
  ShieldCheck,
  Share2,
  TrendingUp,
  Heart,
  Briefcase,
  GraduationCap,
  Clapperboard,
  Building2,
  Globe,
  type LucideProps,
} from "lucide-react";
import type { IconName } from "@/types/landing";

const map: Record<IconName, React.ComponentType<LucideProps>> = {
  messages: MessageCircle,
  vote: Vote,
  wallet: Wallet,
  receipt: Receipt,
  handshake: Handshake,
  map: MapIcon,
  calendar: Calendar,
  sparkles: Sparkles,
  users: Users,
  camera: Camera,
  route: Route,
  compass: Compass,
  gauge: Gauge,
  scan: ScanLine,
  book: BookOpen,
  shield: ShieldCheck,
  share: Share2,
  trending: TrendingUp,
  heart: Heart,
  briefcase: Briefcase,
  school: GraduationCap,
  creator: Clapperboard,
  hotel: Building2,
  globe: Globe,
};

export function Icon({
  name,
  ...props
}: { name: IconName } & LucideProps) {
  const Cmp = map[name] ?? Sparkles;
  return <Cmp {...props} />;
}
