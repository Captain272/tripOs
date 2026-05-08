import * as React from "react";
import { cn } from "@/lib/utils";
import type { TripMember } from "@/types/landing";

export function Avatar({
  member,
  size = 28,
  className,
}: {
  member: TripMember;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-grid place-items-center rounded-full font-semibold text-[10px] text-bg ring-2 ring-bg",
        className
      )}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${member.color}, ${member.color}cc)`,
      }}
    >
      {member.initials}
    </span>
  );
}

export function AvatarStack({
  members,
  max = 5,
  size = 28,
}: {
  members: TripMember[];
  max?: number;
  size?: number;
}) {
  const visible = members.slice(0, max);
  const overflow = members.length - visible.length;
  return (
    <div className="flex -space-x-2">
      {visible.map((m) => (
        <Avatar key={m.name} member={m} size={size} />
      ))}
      {overflow > 0 && (
        <span
          className="grid place-items-center rounded-full bg-white/10 text-fg text-[10px] font-semibold ring-2 ring-bg"
          style={{ width: size, height: size }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
