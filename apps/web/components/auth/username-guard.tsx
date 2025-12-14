"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";

/**
 * UsernameGuard - Redirects logged-in users without username to /setup-username.
 * This component should be placed in the layout to check on every page navigation.
 */
export function UsernameGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Skip if already on setup-username page or auth pages
    if (
      pathname.includes("/setup-username") ||
      pathname.includes("/auth")
    ) {
      return;
    }

    // Prevent multiple checks on same page
    if (hasCheckedRef.current) {
      return;
    }

    async function checkUsername() {
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const user = await res.json();
          // User is logged in but has no username
          if (!user.username) {
            hasCheckedRef.current = true;
            router.replace("/setup-username");
            return;
          }
        }
        // Not logged in or has username - no redirect needed
        hasCheckedRef.current = true;
      } catch {
        // Error fetching user - ignore
        hasCheckedRef.current = true;
      }
    }

    checkUsername();
  }, [pathname, router]);

  // Reset check when pathname changes
  useEffect(() => {
    hasCheckedRef.current = false;
  }, [pathname]);

  // Don't render anything - this is just a guard
  return null;
}
