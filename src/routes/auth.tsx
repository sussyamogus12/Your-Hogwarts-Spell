import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StarfieldBackground } from "@/components/StarfieldBackground";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Вход — Заклинания Хогвартса" },
      {
        name: "description",
        content:
          "Войдите или зарегистрируйтесь, чтобы выкладывать свои заклинания в общую библиотеку Хогвартса.",
      },
      { property: "og:title", content: "Вход — Заклинания Хогвартса" },
      {
        property: "og:description",
        content: "Войдите, чтобы делиться своими заклинаниями со всеми.",
      },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "register";

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionLoading && session) {
      navigate({ to: "/library", replace: true });
    }
  }, [session, sessionLoading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (mode === "register") {
        if (displayName.trim().length < 2) {
          toast.error("Придумайте имя волшебника (от 2 символов).");
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName.trim() },
          },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Добро пожаловать в Хогвартс!");
        navigate({ to: "/library", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          toast.error("Неверная почта или пароль.");
          return;
        }
        toast.success("С возвращением!");
        navigate({ to: "/library", replace: true });
      }
    } catch {
      toast.error("Что-то пошло не так. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Не удалось войти через Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/library", replace: true });
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <StarfieldBackground count={38} />
      <div className="relative z-10">
        <SiteHeader />

        <main className="mx-auto flex w-full max-w-md flex-col px-5 py-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-gold/30 bg-card/70 p-7 shadow-arcane backdrop-blur-md"
          >
            <div className="mb-6 text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/50 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {mode === "login" ? "Вход" : "Регистрация"}
              </div>
              <h1 className="font-display text-3xl text-primary text-glow-gold">
                {mode === "login" ? "С возвращением" : "Стань волшебником"}
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-1.5">
                  <Label htmlFor="displayName">Имя волшебника</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Например: Полумна Лавгуд"
                    maxLength={40}
                    className="border-gold/30 bg-card/50"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Почта</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@hogwarts.magic"
                  className="border-gold/30 bg-card/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  className="border-gold/30 bg-card/50"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary py-5 font-display tracking-wide text-gold-foreground"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Wand2 className="h-5 w-5" />
                )}
                {mode === "login" ? "Войти" : "Зарегистрироваться"}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-gold/20" />
              или
              <div className="h-px flex-1 bg-gold/20" />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={signInWithGoogle}
              className="w-full border-gold/30"
            >
              <GoogleIcon />
              Войти через Google
            </Button>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "login" ? "Ещё нет аккаунта? " : "Уже есть аккаунт? "}
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {mode === "login" ? "Зарегистрироваться" : "Войти"}
              </button>
            </p>
          </motion.div>

          <Link
            to="/library"
            className="mt-6 text-center text-sm text-muted-foreground/80 hover:text-foreground"
          >
            Смотреть библиотеку без входа →
          </Link>
        </main>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
