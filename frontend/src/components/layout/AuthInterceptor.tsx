"use client";

import { useEffect } from "react";

export function AuthInterceptor() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if the script in layout.tsx caught an email signup confirmation
      if (window.sessionStorage.getItem("verify_redirect") === "true") {
        window.sessionStorage.removeItem("verify_redirect");
        window.location.href = "/login?verified=true";
      }
    }
  }, []);

  return null;
}
