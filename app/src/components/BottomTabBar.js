"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HotspotIcon, MessagesIcon, LeaderboardIcon, SharesIcon, ProfileIcon } from "./icons";

const tabs = [
  { href: "/hotspot", label: "Hotspot", Icon: HotspotIcon },
  { href: "/messages", label: "Messages", Icon: MessagesIcon },
  { href: "/leaderboard", label: "Ranks", Icon: LeaderboardIcon },
  { href: "/shares", label: "Shares", Icon: SharesIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const activePath = pathname === "/" ? "/hotspot" : pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] md:bottom-4 md:px-4">
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-around border-t border-border bg-surface px-2 md:rounded-2xl md:border md:shadow-warm">
        {tabs.map(({ href, label, Icon }) => {
          const isActive = activePath === href || activePath.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors ${
                isActive ? "text-accent" : "text-text-muted"
              }`}
            >
              <Icon className="w-6 h-6 mb-1" active={isActive} />
              <span className={`font-pixel text-[8px] ${isActive ? "text-accent" : "text-text-muted"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
