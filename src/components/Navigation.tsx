"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UserRoundSearch, Newspaper, MapPin } from "lucide-react";
import clsx from "clsx";

const tabs = [
  { href: "/", label: "홈", icon: LayoutDashboard },
  { href: "/personalized", label: "맞춤분석", icon: UserRoundSearch },
  { href: "/news-analysis", label: "뉴스분석", icon: Newspaper },
  { href: "/regional", label: "우리동네", icon: MapPin },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-[#ECEAE5] sticky top-0 z-50">
      <div className="mx-auto px-6 md:px-12 lg:px-20">
        <div className="h-14 md:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#FF8C3A] flex items-center justify-center shadow-sm shadow-orange-200">
              <span className="text-white text-sm font-extrabold">이</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[#1A1A1A] text-base leading-tight">이르미</span>
              <span className="text-[10px] text-[#AAA] leading-tight hidden sm:block">민생위기 조기경보</span>
            </div>
          </Link>
        </div>

        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => {
            const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={clsx(
                  "flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium rounded-t-xl transition-colors relative",
                  isActive
                    ? "text-[#FF6B00] nav-active"
                    : "text-[#AAA] hover:text-[#666]"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
