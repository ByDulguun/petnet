"use client";

import { Suspense, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Bell, CalendarCheck2, LayoutDashboard, Menu, PawPrint, Search, LogOut } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link, usePathname } from "@/i18n/navigation";
import { logoutAction } from "@/lib/actions/auth-actions";
import { AUTH_ROUTES_LIVE, MAIN_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const user = session?.user ?? null;
  const sessionLoading = status === "loading";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const initial = (user?.name ?? user?.email ?? "?").slice(0, 1).toUpperCase();

  // No polling — a one-time fetch per session, invalidated by the
  // notifications page itself (shared react-query client) when the user
  // reads something, so the badge stays correct without real-time infra.
  const { data: unreadCount } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/unread-count");
      if (!res.ok) return 0;
      const data = (await res.json()) as { count: number };
      return data.count;
    },
    enabled: Boolean(user),
    staleTime: Infinity,
  });
  const hasUnread = Boolean(unreadCount && unreadCount > 0);

  // Always a fresh check, never the session's cached role — a claim
  // approval must show the dashboard link on next load, not next login.
  // This is purely a nav-visibility hint; every business route re-verifies
  // ownership server-side regardless of what the nav shows.
  const { data: hasBusiness } = useQuery({
    queryKey: ["business", "mine"],
    queryFn: async () => {
      const res = await fetch("/api/business/mine");
      if (!res.ok) return false;
      const data = (await res.json()) as { hasBusiness: boolean };
      return data.hasBusiness;
    },
    enabled: Boolean(user),
    staleTime: Infinity,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function isActive(href: string): boolean {
    const path = href.split("?")[0];
    return pathname === path || pathname.startsWith(`${path}/`);
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/80 shadow-soft backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {MAIN_NAV.map((item) =>
              item.comingSoon ? (
                <span
                  key={item.href}
                  aria-disabled="true"
                  className="inline-flex cursor-default items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground/50"
                >
                  {t(item.labelKey)}
                  <Badge variant="secondary" className="text-[10px] font-semibold text-muted-foreground/70">
                    {t("comingSoon")}
                  </Badge>
                </span>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-brand-soft text-brand"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  {t(item.labelKey)}
                </Link>
              ),
            )}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("search")}
            className="text-muted-foreground"
            asChild
          >
            <Link href="/map">
              <Search className="size-4.5" />
            </Link>
          </Button>

          <Suspense fallback={<Skeleton className="size-9 rounded-full" />}>
            <LanguageSwitcher />
          </Suspense>
          <ThemeToggle />

          {sessionLoading ? (
            <Skeleton className="size-9 rounded-full" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label={tAuth("menuAria")}
                >
                  <Avatar size="sm">
                    <AvatarFallback className="bg-brand-soft font-bold text-brand">
                      {initial}
                    </AvatarFallback>
                    {hasUnread && <AvatarBadge className="bg-danger" aria-label={tAuth("menuNotifications")} />}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuItem asChild>
                  <Link href="/pets">
                    <PawPrint className="size-4" />
                    {tAuth("menuPets")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/bookings">
                    <CalendarCheck2 className="size-4" />
                    {tAuth("menuBookings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/notifications">
                    <Bell className="size-4" />
                    {tAuth("menuNotifications")}
                    {hasUnread && (
                      <span className="ml-auto size-1.5 rounded-full bg-danger" aria-hidden="true" />
                    )}
                  </Link>
                </DropdownMenuItem>
                {hasBusiness && (
                  <DropdownMenuItem asChild>
                    <Link href="/business/dashboard">
                      <LayoutDashboard className="size-4" />
                      {tAuth("menuBusinessDashboard")}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <form action={logoutAction}>
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full">
                      <LogOut className="size-4" />
                      {tAuth("menuLogout")}
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            AUTH_ROUTES_LIVE && (
              <div className="hidden items-center gap-2 sm:flex">
                <Button variant="ghost" asChild>
                  <Link href="/login">{t("login")}</Link>
                </Button>
                <Button className="rounded-full font-semibold" asChild>
                  <Link href="/register">
                    <PawPrint className="size-4" />
                    {t("getStarted")}
                  </Link>
                </Button>
              </div>
            )
          )}

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label={t("openMenu")}
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="sr-only">{t("menuTitle")}</SheetTitle>
                <Logo />
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4" aria-label="Mobile main">
                {MAIN_NAV.map((item) => {
                  const Icon = item.icon;
                  if (item.comingSoon) {
                    return (
                      <span
                        key={item.href}
                        aria-disabled="true"
                        className="flex cursor-default items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-muted-foreground/50"
                      >
                        {Icon && <Icon className="size-5 opacity-50" />}
                        {t(item.labelKey)}
                        <Badge variant="secondary" className="ml-auto text-[10px] font-semibold text-muted-foreground/70">
                          {t("comingSoon")}
                        </Badge>
                      </span>
                    );
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-brand-soft text-brand"
                          : "text-foreground hover:bg-secondary",
                      )}
                    >
                      {Icon && <Icon className="size-5 opacity-70" />}
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </nav>
              {user ? (
                <div className="mt-auto flex flex-col gap-1 border-t p-4">
                  <Link
                    href="/pets"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-foreground hover:bg-secondary"
                  >
                    <PawPrint className="size-5 opacity-70" />
                    {tAuth("menuPets")}
                  </Link>
                  <Link
                    href="/bookings"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-foreground hover:bg-secondary"
                  >
                    <CalendarCheck2 className="size-5 opacity-70" />
                    {tAuth("menuBookings")}
                  </Link>
                  <Link
                    href="/notifications"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-foreground hover:bg-secondary"
                  >
                    <Bell className="size-5 opacity-70" />
                    {tAuth("menuNotifications")}
                    {hasUnread && (
                      <span className="ml-auto size-1.5 rounded-full bg-danger" aria-hidden="true" />
                    )}
                  </Link>
                  {hasBusiness && (
                    <Link
                      href="/business/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-foreground hover:bg-secondary"
                    >
                      <LayoutDashboard className="size-5 opacity-70" />
                      {tAuth("menuBusinessDashboard")}
                    </Link>
                  )}
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] font-medium text-danger hover:bg-danger-soft"
                    >
                      <LogOut className="size-5" />
                      {tAuth("menuLogout")}
                    </button>
                  </form>
                </div>
              ) : (
                AUTH_ROUTES_LIVE && (
                  <div className="mt-auto flex flex-col gap-2 border-t p-4">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/login" onClick={() => setMobileOpen(false)}>
                        {t("login")}
                      </Link>
                    </Button>
                    <Button className="w-full font-semibold" asChild>
                      <Link href="/register" onClick={() => setMobileOpen(false)}>
                        <PawPrint className="size-4" />
                        {t("getStarted")}
                      </Link>
                    </Button>
                  </div>
                )
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <Separator
        className={cn(
          "transition-opacity duration-300",
          scrolled ? "opacity-0" : "opacity-100",
        )}
      />
    </header>
  );
}
