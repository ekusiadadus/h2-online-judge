"use client";

import { useEffect, useState } from "react";
import { LoginButton } from "./login-button";
import { UserMenu } from "./user-menu";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
}

interface AuthStatusProps {
  className?: string;
}

/**
 * Auth status component that shows login button or user menu.
 * Fetches current user on mount.
 */
export function AuthStatus({ className }: AuthStatusProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch {
        // Not logged in
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
    );
  }

  if (user) {
    return <UserMenu user={user} className={className} />;
  }

  return <LoginButton className={className} />;
}
