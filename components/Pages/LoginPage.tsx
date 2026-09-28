"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts";
import { useRouter, useSearchParams } from "next/navigation";
import { AUTH_FORM_FIELD_SKY } from "@/components/auth/auth-glass-styles";
import {
  GLASS_BUTTON_ICON_HOVER,
  GLASS_PRIMARY_BUTTON,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { setPostLoginWelcome } from "@/lib/auth/post-login-welcome";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { AuthFormCard } from "@/components/auth/AuthFormCard";
import { SafeImage } from "@/components/ui/safe-image";
import { AuthAnimatedBlock } from "@/components/auth/AuthAnimatedBlock";
import {
  AUTH_FORM_ROW_STAGGER_MS,
  AUTH_FORM_STAGGER_BASE,
} from "@/components/auth/auth-animation";
import { Loader2, Zap } from "lucide-react";

/**
 * Login page client component (uses useSearchParams for OAuth/redirect).
 * REQ-0030 — shared AuthPageShell, role Select icons, stagger animations.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigatingToHome, setIsNavigatingToHome] = useState(false);
  const { login, isLoggedIn, user } = useAuth();

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const navigatingFromSubmitRef = useRef(false);

  useEffect(() => {
    if (isLoggedIn && !navigatingFromSubmitRef.current) {
      const dest =
        user?.role === "client"
          ? "/client"
          : user?.role === "supplier"
            ? "/supplier"
            : "/";
      window.location.href = dest;
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      let errorMessage = "An error occurred during Google sign-in.";

      switch (error) {
        case "oauth_not_configured":
          errorMessage =
            "Google OAuth is not configured. Please contact support.";
          break;
        case "oauth_failed":
          errorMessage =
            "Google sign-in was cancelled or failed. Please try again.";
          break;
        case "invalid_state":
          errorMessage = "Invalid OAuth state. Please try again.";
          break;
        case "no_code":
          errorMessage = "OAuth authorization code missing. Please try again.";
          break;
        case "token_exchange_failed":
          errorMessage = "Failed to exchange OAuth token. Please try again.";
          break;
        case "fetch_user_failed":
          errorMessage =
            "Failed to fetch user information from Google. Please try again.";
          break;
        case "no_email":
          errorMessage = "Google account email is required. Please try again.";
          break;
        case "oauth_processing_failed":
        case "oauth_error":
          errorMessage =
            "An error occurred during OAuth processing. Please try again.";
          break;
        default:
          errorMessage = `OAuth error: ${error}. Please try again.`;
      }

      toast({
        title: "فشل تسجيل الدخول عبر Google",
        description: errorMessage,
        variant: "destructive",
      });

      router.replace("/login");
    }
  }, [searchParams, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userData = await login(email, password);
      const userName = userData.name || userData.email.split("@")[0] || "User";

      navigatingFromSubmitRef.current = true;
      setIsNavigatingToHome(true);

      setPostLoginWelcome({
        userName,
        role: userData.role ?? "user",
      });

      const dest =
        userData.role === "client"
          ? "/client"
          : userData.role === "supplier"
            ? "/supplier"
            : "/";
      window.location.href = dest;
    } catch (error: unknown) {
      const axiosErr = error as {
        response?: { data?: { error?: string }; status?: number };
      };
      const serverMessage = axiosErr?.response?.data?.error;
      toast({
        title: "فشل تسجيل الدخول",
        description:
          serverMessage || "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
        variant: "destructive",
      });
    } finally {
      if (!navigatingFromSubmitRef.current) setIsLoading(false);
    }
  };

  const formDisabled = isLoading || isNavigatingToHome;

  const formRowDelay = (row: number) =>
    AUTH_FORM_STAGGER_BASE + row * AUTH_FORM_ROW_STAGGER_MS;

  const leftPanel = (
    <header
      dir="rtl"
      lang="ar"
      className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 sm:gap-8"
    >
      <SafeImage
        src="/cuisine-bob/logo-min-intr.png"
        alt="الإدارة العامة لوحدات التدخل"
        width={160}
        height={160}
        priority
        className="h-[clamp(5.25rem,17vh,9rem)] w-[clamp(5.25rem,17vh,9rem)] object-contain"
      />
      <div className="min-w-0 text-center">
        <p className="text-base font-semibold leading-relaxed text-gray-900 dark:text-white sm:text-lg lg:text-xl">
          الإدارة العامة لوحدات التدخل
        </p>
        <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-white/80 sm:text-base">
          إدارة حفظ النظام الجهوي بالشمال
        </p>
        <p className="text-sm leading-relaxed text-gray-600 dark:text-white/80 sm:text-base">
          الفوج الجهوي لحفظ النظام بالمنستير
        </p>
      </div>
      <SafeImage
        src="/cuisine-bob/logo-police.png"
        alt="الشرطة"
        width={160}
        height={160}
        priority
        className="h-[clamp(5.25rem,17vh,9rem)] w-[clamp(5.25rem,17vh,9rem)] object-contain"
      />
    </header>
  );

  const rightPanel = (
    <AuthAnimatedBlock
      delayMs={AUTH_FORM_STAGGER_BASE}
      className="w-full max-w-md"
    >
      <div dir="rtl" lang="ar">
      <AuthFormCard variant="login" className="w-full p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthAnimatedBlock delayMs={formRowDelay(0)} className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700 dark:text-white/80"
            >
              البريد الإلكتروني
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              disabled={formDisabled}
              className={cn("w-full", AUTH_FORM_FIELD_SKY)}
            />
          </AuthAnimatedBlock>

          <AuthAnimatedBlock delayMs={formRowDelay(1)} className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700 dark:text-white/80"
            >
              كلمة المرور
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور"
              required
              disabled={formDisabled}
              className={cn("w-full", AUTH_FORM_FIELD_SKY)}
            />
          </AuthAnimatedBlock>

          <AuthAnimatedBlock delayMs={formRowDelay(2)}>
            <Button
              type="submit"
              className={cn(
                GLASS_BUTTON_ICON_HOVER,
                "w-full",
                GLASS_PRIMARY_BUTTON.sky,
              )}
              disabled={formDisabled}
            >
              {isNavigatingToHome ? (
                <>
                  <Loader2 className="ms-2 h-4 w-4 animate-spin" />
                  جاري فتح لوحة التحكم…
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="ms-2 h-4 w-4 animate-spin" />
                  جاري تسجيل الدخول…
                </>
              ) : (
                <>
                  <Zap className="ms-2 h-4 w-4" />
                  تسجيل الدخول
                </>
              )}
            </Button>
          </AuthAnimatedBlock>
        </form>
      </AuthFormCard>
      </div>
    </AuthAnimatedBlock>
  );

  const cartPanel = (
    <SafeImage
      src="/stock_inventory.svg"
      alt="Chariot"
      width={520}
      height={420}
      priority
      className="block h-[78%] max-h-[78%] w-auto max-w-[78%] object-contain"
    />
  );

  return (
    <AuthPageShell
      illustrationSrc="/stock_inventory.svg"
      illustrationAlt=""
      showIllustration={false}
      fitViewport
      alignEnd
      top={leftPanel}
      left={cartPanel}
      right={rightPanel}
    />
  );
}
