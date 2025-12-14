"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";

interface User {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  role: "user" | "admin";
}

interface UserMenuProps {
  user: User;
  className?: string;
}

/**
 * User menu dropdown showing user info and logout option.
 */
export function UserMenu({ user, className }: UserMenuProps) {
  const t = useTranslations("auth");
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const displayName = user.username || user.name || user.email.split("@")[0] || "U";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className={cn("relative", className)} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 rounded-full p-1 hover:bg-accent transition-colors"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
          {initials}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-background shadow-lg z-50">
          <div className="p-3 border-b border-border">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
            {user.role === "admin" && (
              <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                {t("admin")}
              </span>
            )}
          </div>
          <div className="p-2 space-y-1">
            <Link
              href="/profile"
              className="flex w-full items-center px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {t("profile")}
            </Link>
            {user.role === "admin" && (
              <Link
                href="/admin/problems/new"
                className="flex w-full items-center px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                onClick={() => setIsOpen(false)}
              >
                + Create Problem
              </Link>
            )}
            <LogoutButton
              variant="ghost"
              size="sm"
              className="w-full justify-start"
            />
          </div>
        </div>
      )}
    </div>
  );
}
