"use client";

import {
  GlobeIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  PaletteIcon,
  SunIcon,
  UserIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useState } from "react";

import { setLocale } from "@/actions/locale";
import { Logo } from "@/components/logo";
import { ResponsiveDialog, ProfileContent } from "@/components/profile";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useAuth } from "@/lib/auth";

export function UserMenu() {
  const { user, isLoading, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const locale = useLocale();
  const t = useTranslations();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleLanguageChange = async (newLocale: "fr" | "en") => {
    if (newLocale === locale) return;

    try {
      await setLocale(newLocale);
    } catch {
      // Silent error
    }
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="icon" className="rounded-full overflow-hidden shadow-2xl">
        <Logo />
      </Button>
    );
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };
  return (
    <>
      <ResponsiveDialog
        title={t("common.profile.myAccount")}
        description={t("auth.profile.editProfileDescription")}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      >
        <ProfileContent closeDialog={handleCloseDialog} />
      </ResponsiveDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full shadow- dark:shadow-accent">
            <Avatar className="size-12 md:size-10 hover:scale-105 transition-all duration-300 border border-accent shadow-2xl">
              <AvatarImage
                src={user?.avatarUrl ?? undefined}
                alt="User avatar"
                loading="lazy"
                className="object-cover bg-accent"
              />
              <AvatarFallback className="bg-primary text-primary-foreground font-display font-bold text-lg lg:text-base">
                {user?.name?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-44"
          align="start"
          side="left"
          sideOffset={isMobile ? 14 : 6}
          loop={true}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-medium text-md md:text-sm">
              {t("common.profile.myAccount")}
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setIsDialogOpen(true)} className="text-md md:text-sm">
              <UserIcon className="h-4 w-4" />
              {t("common.buttons.profile")}
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-md md:text-sm">
                <PaletteIcon className="h-4 w-4" />
                {t("common.theme.title")}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent sideOffset={8}>
                  <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    disabled={theme === "light"}
                    className="text-md md:text-sm"
                  >
                    <SunIcon className="h-4 w-4" />
                    {t("common.theme.light")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    disabled={theme === "dark"}
                    className="text-md md:text-sm"
                  >
                    <MoonIcon className="h-4 w-4" />
                    {t("common.theme.dark")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className="text-md md:text-sm"
                    disabled={theme === "system"}
                  >
                    <MonitorIcon className="h-4 w-4" />
                    {t("common.theme.system")}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-md md:text-sm">
                <GlobeIcon className="h-4 w-4" />
                {t("common.language")}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent sideOffset={8}>
                  <DropdownMenuItem
                    className="text-md md:text-sm"
                    onClick={() => handleLanguageChange("en")}
                    disabled={locale === "en"}
                  >
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-md md:text-sm"
                    onClick={() => handleLanguageChange("fr")}
                    disabled={locale === "fr"}
                  >
                    Français
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => logout()}
            className="text-md md:text-sm"
          >
            <LogOutIcon className="h-4 w-4" />
            {t("common.buttons.logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
