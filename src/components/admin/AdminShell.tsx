"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  FileText,
  Star,
  HelpCircle,
  Image as ImageIcon,
  ExternalLink,
  LogOut,
  Menu as MenuIcon,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/admin", label: "Дашборд", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Замовлення (CRM)", icon: ShoppingCart },
  { href: "/admin/products", label: "Товари", icon: Package },
  { href: "/admin/categories", label: "Категорії", icon: FolderTree },
  { href: "/admin/content", label: "Контент секцій", icon: FileText },
  { href: "/admin/reviews", label: "Відгуки", icon: Star },
  { href: "/admin/faq", label: "FAQ", icon: HelpCircle },
  { href: "/admin/media", label: "Медіа", icon: ImageIcon },
];

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const nav = (
    <nav className="flex flex-col gap-1 p-3" aria-label="Адмін-навігація">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2.5 border-b border-border/60 px-5 py-4">
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 text-stone-950">
        <Flame className="size-5" />
      </span>
      <div className="leading-tight">
        <span className="block font-display text-sm font-bold tracking-wide">
          ХАРЧІ · ADMIN
        </span>
        <span className="block text-[11px] text-muted-foreground">
          керування сайтом та CRM
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border/60 bg-card/50 sticky top-0 h-screen">
        {brand}
        {nav}
        <div className="mt-auto space-y-2 p-3 border-t border-border/60">
          <Button asChild variant="outline" size="sm" className="w-full">
            <a href="/" target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" /> Переглянути сайт
            </a>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={logout}
          >
            <LogOut className="size-4" /> Вийти
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-40 flex items-center gap-3 border-b border-border/60 bg-background/90 backdrop-blur px-4 py-3">
          <Button
            variant="outline"
            size="icon"
            aria-label="Меню адмінки"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <MenuIcon className="size-4" />
          </Button>
          <span className="font-display text-sm font-bold">ХАРЧІ · ADMIN</span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            aria-label="Вийти"
            onClick={logout}
          >
            <LogOut className="size-4" />
          </Button>
        </header>

        {mobileOpen && (
          <div className="lg:hidden border-b border-border/60 bg-card/60">
            {nav}
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
