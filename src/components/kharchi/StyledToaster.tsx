"use client";

import { useTheme } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

/** Sonner toaster that follows the active site theme */
export default function StyledToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      theme={resolvedTheme === "light" ? "light" : "dark"}
    />
  );
}
