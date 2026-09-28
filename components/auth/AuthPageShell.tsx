"use client";

import type { ReactNode } from "react";
import { SafeImage } from "@/components/ui/safe-image";

type AuthPageShellProps = {
  illustrationSrc: string;
  illustrationAlt: string;
  left: ReactNode;
  right: ReactNode;
  /** Full-width block above the two columns (login logos). */
  top?: ReactNode;
  /** Push the right column content to the right edge. */
  alignEnd?: boolean;
  /** Keep login on one screen: no document scroll. */
  fitViewport?: boolean;
  /** Login: banner + card stacked and centered, no side column. */
  centered?: boolean;
  showIllustration?: boolean;
};

/**
 * REQ-0030 — shared login/register layout shell.
 * Viewport-centered bg illustration (fixed z-0); content max-w-7xl (REQ-0036: auth-only cap).
 * REQ-0033 / REQ-0216 — auth-page-root marker (document scroll); html scrollbar-gutter is global.
 */
export function AuthPageShell({
  illustrationSrc,
  illustrationAlt,
  left,
  right,
  top,
  alignEnd = false,
  fitViewport = false,
  centered = false,
  showIllustration = true,
}: AuthPageShellProps) {
  return (
    <div className={`auth-page-root relative flex w-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),transparent_55%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.12),transparent_65%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),transparent_55%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.12),transparent_65%)] ${fitViewport ? "auth-page-fit h-dvh items-stretch justify-start" : "min-h-screen items-center justify-center"}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.3),transparent_60%)] dark:bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05),transparent_60%)]" />

      {showIllustration ? (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center"
        >
          <div className="auth-bg-float relative h-[min(75vh,640px)] w-[min(92vw,860px)] opacity-25 dark:opacity-20">
            <SafeImage
              src={illustrationSrc}
              alt={illustrationAlt}
              fill
              className="object-contain object-center"
              priority
            />
          </div>
        </div>
      ) : null}

      <div
        className={`relative z-10 mx-auto w-full ${fitViewport ? "flex h-full min-h-0 max-w-none flex-col px-3 py-3 sm:px-6 sm:py-4" : "max-w-7xl px-2 sm:px-4"}`}
      >
        {top ? (
          <div className={fitViewport ? "shrink-0" : "pt-6 sm:pt-8"}>{top}</div>
        ) : null}
        {centered ? (
          <div className="flex min-h-screen flex-col items-center justify-center gap-8 py-8">
            {left}
            {right}
          </div>
        ) : fitViewport ? (
          <div className="grid min-h-0 flex-1 grid-cols-1 items-center gap-4 overflow-hidden pt-2 md:grid-cols-2 md:gap-8">
            <div className="flex h-full min-h-0 items-center justify-center overflow-hidden">
              {left}
            </div>
            <div className="flex h-full min-h-0 items-center justify-center overflow-hidden">
              {right}
            </div>
          </div>
        ) : (
        <div className="flex min-h-screen flex-col lg:flex-row lg:gap-8">
          <div className="relative hidden items-center justify-center py-6 lg:flex lg:w-1/2 lg:py-12">
            <div className="relative z-10 w-full max-w-2xl space-y-2">
              {left}
            </div>
          </div>

          <div
            className={`flex w-full items-center py-6 sm:py-8 lg:w-1/2 lg:py-12 ${alignEnd ? "justify-center lg:justify-end" : "justify-center"}`}
          >
            {right}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
