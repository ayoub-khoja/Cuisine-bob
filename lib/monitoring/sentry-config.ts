/**
 * Shared Sentry configuration (client, server, edge).
 * Tunnel path must match `tunnelRoute` in next.config.ts so ad blockers cannot block ingest.
 */

import type { ErrorEvent, EventHint } from "@sentry/nextjs";

/** First-party tunnel; browser sends events here instead of ingest.de.sentry.io.
 * Intermittent HTTP 429 on this path is usually Vercel/Sentry rate limiting under
 * envelope bursts — successful 200s still ingest. Do not disable the tunnel for 429 alone.
 */
export const SENTRY_TUNNEL_PATH = "/api/monitoring" as const;

/** DSN from env (never hardcode in source) */
export function getSentryDsn(): string | undefined {
  return process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
}

export function isSentryEnabled(): boolean {
  return Boolean(getSentryDsn());
}

/** Lower sample rate in production; skip traces in local/dev to avoid HTTP/1.1 Overhead noise emails */
export function getTracesSampleRate(): number {
  return process.env.NODE_ENV === "production" ? 0.1 : 0;
}

/** Safari / Chrome NotFoundError text variants for DOM removeChild races */
function isRemoveChildNotFoundMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("removechild") ||
    lower.includes("not a child") ||
    lower.includes("can not be found here") ||
    lower.includes("cannot be found here")
  );
}

/**
 * Radix Select portals to document.body; App Router navigation can tear down the portal
 * while React is still reconciling, causing NotFoundError on removeChild (Safari + Chrome).
 */
export function isRadixPortalRemoveChildError(
  error: Error,
  componentStack?: string,
): boolean {
  if (error.name !== "NotFoundError") {
    return false;
  }

  const message = error.message ?? "";
  const stack = error.stack ?? "";
  if (isRemoveChildNotFoundMessage(message) || isRemoveChildNotFoundMessage(stack)) {
    return true;
  }

  if (componentStack) {
    return (
      componentStack.includes("SelectPortal") ||
      componentStack.includes("SelectContent")
    );
  }

  return false;
}

/** Sentry envelope variant — inspect exception values + React componentStack */
export function isRadixPortalRemoveChildSentryEvent(
  event: ErrorEvent,
): boolean {
  const values = event.exception?.values ?? [];
  for (const v of values) {
    if (v.type !== "NotFoundError" && v.type !== "Error") {
      continue;
    }
    const text = typeof v.value === "string" ? v.value : "";
    if (isRemoveChildNotFoundMessage(text)) {
      return true;
    }
  }

  const componentStack = (
    event.contexts?.react as { componentStack?: string } | undefined
  )?.componentStack;
  if (componentStack) {
    return (
      componentStack.includes("SelectPortal") ||
      componentStack.includes("SelectContent")
    );
  }

  const serialized = JSON.stringify({
    breadcrumbs: event.breadcrumbs,
    contexts: event.contexts,
    extra: event.extra,
  });
  return (
    serialized.includes("SelectPortal") || serialized.includes("SelectContent")
  );
}

/**
 * Chrome/Edge "Translate this page" mutates the DOM; React then throws NotFoundError on removeChild.
 * Drop only when translation is indicated; Radix portal races are handled separately.
 */
export function isBrowserTranslationRemoveChildError(
  event: ErrorEvent,
): boolean {
  const values = event.exception?.values ?? [];
  const isRemoveChild = values.some(
    (v) =>
      (v.type === "NotFoundError" ||
        (typeof v.value === "string" && v.value.includes("NotFoundError"))) &&
      typeof v.value === "string" &&
      v.value.includes("removeChild") &&
      v.value.includes("not a child"),
  );
  if (!isRemoveChild) {
    return false;
  }

  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (
      root.classList.contains("translated-ltr") ||
      root.classList.contains("translated-rtl")
    ) {
      return true;
    }
  }

  const serialized = JSON.stringify({
    breadcrumbs: event.breadcrumbs,
    contexts: event.contexts,
    extra: event.extra,
  });
  return (
    serialized.includes("translated-ltr") ||
    serialized.includes("translated-rtl")
  );
}

/** Shared ignore list (extensions, benign browser noise, stale deploy chunks) */
export const SENTRY_IGNORE_ERRORS: Array<string | RegExp> = [
  "top.GLOBALS",
  "originalCreateNotification",
  "canvas.contentDocument",
  "MyApp_RemoveAllHighlights",
  "atomicFindClose",
  "fb_xd_fragment",
  "bmi_SafeAddOnload",
  "EBCallBackMessageReceived",
  "conduitPage",
  "NetworkError",
  "Failed to fetch",
  "Network request failed",
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications",
  "Non-Error promise rejection captured",
  "AI service did not return insights",
  "ChunkLoadError",
  "Loading chunk",
  "Failed to load chunk",
  /Loading CSS chunk [\d]+ failed/,
  // REQ-0234 — wallet / browser-extension injectors (not app code)
  "Failed to connect to MetaMask",
  /MetaMask/i,
  /M_ID/,
  /inpage\.js/i,
];

/** Drop events whose stack/frames come from browser extensions */
export const SENTRY_DENY_URLS: RegExp[] = [
  /^chrome-extension:\/\//i,
  /^moz-extension:\/\//i,
  /^safari-extension:\/\//i,
  /^safari-web-extension:\/\//i,
  /scripts\/inpage\.js/i,
  /metamask/i,
];

/** True when exception text looks like a stale Next.js chunk after deploy */
export function isChunkLoadSentryEvent(event: ErrorEvent): boolean {
  const values = event.exception?.values ?? [];
  for (const v of values) {
    const type = v.type ?? "";
    const text = typeof v.value === "string" ? v.value : "";
    if (
      type === "ChunkLoadError" ||
      /chunkloaderror/i.test(text) ||
      /loading chunk/i.test(text) ||
      /failed to load chunk/i.test(text) ||
      /loading css chunk/i.test(text)
    ) {
      return true;
    }
  }
  return false;
}

/** REQ-0234 — MetaMask / wallet extension client noise */
export function isWalletExtensionSentryEvent(event: ErrorEvent): boolean {
  const values = event.exception?.values ?? [];
  for (const v of values) {
    const text = typeof v.value === "string" ? v.value : "";
    if (
      /metamask/i.test(text) ||
      /M_ID/.test(text) ||
      /Failed to connect to MetaMask/i.test(text)
    ) {
      return true;
    }
  }
  const frames = values.flatMap((v) => v.stacktrace?.frames ?? []);
  for (const frame of frames) {
    const filename = frame.filename ?? "";
    if (/inpage\.js/i.test(filename) || /metamask/i.test(filename)) {
      return true;
    }
  }
  const serialized = JSON.stringify({
    breadcrumbs: event.breadcrumbs,
    exception: event.exception,
    request: event.request,
  });
  return (
    /inpage\.js/i.test(serialized) ||
    /Failed to connect to MetaMask/i.test(serialized) ||
    /["']M_ID["']/.test(serialized)
  );
}

/** Strip auth/cookies before events leave the app; drop known DOM noise (translate + Radix portal) */
export function scrubSentryEvent(
  event: ErrorEvent,
  _hint?: EventHint,
): ErrorEvent | null {
  if (
    isBrowserTranslationRemoveChildError(event) ||
    isRadixPortalRemoveChildSentryEvent(event) ||
    isChunkLoadSentryEvent(event) ||
    isWalletExtensionSentryEvent(event)
  ) {
    return null;
  }

  if (event.request) {
    delete event.request.headers?.authorization;
    delete event.request.headers?.cookie;
    delete event.request.cookies;
  }
  if (event.contexts?.request?.headers) {
    const headers = event.contexts.request.headers as Record<string, unknown>;
    delete headers.authorization;
    delete headers.cookie;
  }
  return event;
}

/** Base options reused by server and edge runtimes */
export function getServerSentryInitOptions() {
  const dsn = getSentryDsn();
  return {
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: getTracesSampleRate(),
    enableLogs: false,
    sendDefaultPii: false,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
    beforeSend: scrubSentryEvent,
    ignoreErrors: SENTRY_IGNORE_ERRORS,
    denyUrls: SENTRY_DENY_URLS,
  } as const;
}

/** Client-only options (tunnel, replay, browser tracing) */
export function getClientSentryInitOptions() {
  const dsn = getSentryDsn();
  return {
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: getTracesSampleRate(),
    enableLogs: false,
    sendDefaultPii: false,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
    // Routes browser envelopes through our domain (see SENTRY_TUNNEL_PATH + next.config tunnelRoute)
    tunnel: SENTRY_TUNNEL_PATH,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    beforeSend: scrubSentryEvent,
    ignoreErrors: SENTRY_IGNORE_ERRORS,
    denyUrls: SENTRY_DENY_URLS,
  } as const;
}
