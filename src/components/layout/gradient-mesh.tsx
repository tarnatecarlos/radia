"use client";

import { useTheme } from "@/components/theme-provider";

export function GradientMesh() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Base gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "linear-gradient(to bottom right, #020617, #0B1329)"
            : "linear-gradient(to bottom right, #F8FAFC, #F1F5F9)",
        }}
      />

      {/* Orb 1 - Indigo */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-[120px]"
        style={{
          background: "#4F46E5",
          opacity: isDark ? 0.3 : 0.12,
          top: "10%",
          left: "15%",
          animation: "orb-float-1 20s ease-in-out infinite",
        }}
      />

      {/* Orb 2 - Teal */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-[120px]"
        style={{
          background: "#0D9488",
          opacity: isDark ? 0.25 : 0.1,
          top: "50%",
          right: "10%",
          animation: "orb-float-2 25s ease-in-out infinite",
        }}
      />

      {/* Orb 3 - Violet */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full blur-[120px]"
        style={{
          background: "#7C3AED",
          opacity: isDark ? 0.2 : 0.1,
          bottom: "10%",
          left: "40%",
          animation: "orb-float-3 30s ease-in-out infinite",
        }}
      />
    </div>
  );
}
