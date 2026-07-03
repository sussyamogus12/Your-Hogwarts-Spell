import { Link, useNavigate } from "@tanstack/react-router";
import { LogIn, LogOut, Sparkles, User as UserIcon, Wand2, BookOpen } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Волшебник";

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="relative z-20 mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 py-4">
      <Link to="/" className="flex items-center gap-2 font-display text-lg text-primary text-glow-gold">
        <Sparkles className="h-5 w-5" />
        <span className="hidden sm:inline">Заклинания Хогвартса</span>
        <span className="sm:hidden">Хогвартс</span>
      </Link>

      <nav className="flex items-center gap-1.5">
        <NavLink to="/" icon={<Wand2 className="h-4 w-4" />} label="Подобрать" />
        <NavLink to="/library" icon={<BookOpen className="h-4 w-4" />} label="Библиотека" />

        {session ? (
          <div className="ml-1 flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-gold/30 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground sm:inline-flex">
              <UserIcon className="h-3.5 w-3.5 text-primary" />
              {displayName}
            </span>
            <Button variant="outline" size="sm" onClick={signOut} className="border-gold/30">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Выйти</span>
            </Button>
          </div>
        ) : (
          <Button asChild size="sm" className="ml-1 bg-primary text-gold-foreground">
            <Link to="/auth">
              <LogIn className="h-4 w-4" />
              Войти
            </Link>
          </Button>
        )}
      </nav>
    </header>
  );
}

function NavLink({ to, icon, label }: { to: "/" | "/library"; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/" }}
      className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      activeProps={{ className: cn("text-primary") }}
    >
      <span className="flex items-center gap-1.5">
        {icon}
        <span className="hidden xs:inline sm:inline">{label}</span>
      </span>
    </Link>
  );
}
