import { createAuthClient } from "better-auth/react";

/**
 * Get API URL with auto-detection for Daytona sandboxes
 */
function getApiUrl(): string {
  // Explicit env var takes precedence
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Auto-detect in Daytona sandbox (production)
  if (
    typeof window !== "undefined" &&
    window.location.hostname.includes(".proxy.daytona.works")
  ) {
    const parts = window.location.hostname.split("-");
    if (parts.length >= 2) {
      const sandboxPart = parts
        .slice(1)
        .join("-")
        .replace(".proxy.daytona.works", "");
      return `https://3001-${sandboxPart}.proxy.daytona.works`;
    }
  }

  // Local development
  return "http://localhost:3001";
}

/**
 * Better Auth client for React
 *
 * Usage:
 *   import { authClient } from "@/lib/auth";
 *
 *   // Sign up
 *   await authClient.signUp.email({ email, password, name });
 *
 *   // Sign in
 *   await authClient.signIn.email({ email, password });
 *
 *   // Sign out
 *   await authClient.signOut();
 *
 *   // Get session (React hook)
 *   const { data: session, isPending } = authClient.useSession();
 */
export const authClient = createAuthClient({
  baseURL: getApiUrl(),
});

// Export individual hooks and methods for convenience
export const { useSession, signIn, signUp, signOut } = authClient;
