"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HotspotIcon, MessagesIcon, LeaderboardIcon, SharesIcon, ProfileIcon } from "./icons";

const tabs = [
  { href: "/hotspot", label: "Hotspot", Icon: HotspotIcon },
  { href: "/messages", label: "Messages", Icon: MessagesIcon },
  { href: "/leaderboard", label: "Ranks", Icon: LeaderboardIcon },
  { href: "/shares", label: "Market", Icon: SharesIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
];

export default function BottomTabBar({ unreadCount = 0 }) {
  const pathname = usePathname();
  const activePath = pathname === "/" ? "/hotspot" : pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[1000] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-16 w-full items-center justify-around border-t border-border bg-surface px-2">
        {tabs.map(({ href, label, Icon }) => {
          const isActive = activePath === href || activePath.startsWith(`${href}/`);
          const showBadge = href === "/messages" && unreadCount > 0;
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors relative ${
                isActive ? "text-accent" : "text-text-muted"
              }`}
            >
              <div className="relative">
                <Icon className="w-6 h-6 mb-1" active={isActive} />
                {showBadge && (
                  <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              <span className={`font-heading text-xs ${isActive ? "text-accent" : "text-text-muted"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
