"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Trophy, ListOrdered, User } from "lucide-react";

const items = [
  { href: "/", label: "Fixtures", icon: CalendarDays },
  { href: "/standings", label: "Groups", icon: ListOrdered },
  { href: "/leaderboard", label: "Ranks", icon: Trophy },
  { href: "/profile", label: "You", icon: User },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="sticky bottom-0 z-30 grid grid-cols-4 border-t border-zinc-200 bg-white/90 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      {items.map(({ href, label, icon: Icon }) => {
        const active = path === href || (href !== "/" && path.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center py-2.5 text-[11px] font-medium ${
              active ? "text-emerald-600" : "text-zinc-500"
            }`}
          >
            <Icon className="size-5 mb-0.5" strokeWidth={active ? 2.5 : 2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
