import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Moon,
  Sun,
  Images,
  History,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ImageSealLogo from "@/components/fx/ImageSealLogo";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard", label: "Original Images", icon: Images, hash: "original-images" },
  { to: "/verify", label: "Verify image", icon: ShieldCheck },
  { to: "/history", label: "Verification History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function AppHeader() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const currentHash = useRouterState({ select: (s) => s.location.hash });
  const [email, setEmail] = useState<string | null>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const enabled = localStorage.getItem("imageseal-theme") === "dark";
    setDark(enabled);
    document.documentElement.classList.toggle("theme-dark", enabled);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("imageseal-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("theme-dark", next);
  };

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
        return;
      }
      queryClient.clear();
      navigate({ to: "/auth", replace: true });
    } catch (signOutError) {
      toast.error(
        signOutError instanceof Error ? signOutError.message : "Could not sign out. Please try again.",
      );
    }
  };

  return (
    <>
      <header className="app-sidebar">
        <button className="brand" onClick={() => navigate({ to: "/dashboard" })}>
          <ImageSealLogo size={36} />
          <span>
            <strong>ImageSeal</strong>
            <small>Image integrity</small>
          </span>
        </button>
        <div className="mobile-header-actions">
          <button
            aria-label={dark ? "Switch to light appearance" : "Switch to dark appearance"}
            onClick={toggleTheme}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button aria-label="Sign out" onClick={handleSignOut}>
            <LogOut size={17} />
          </button>
        </div>
        <p className="sidebar-caption">WORKSPACE</p>
        <nav className="sidebar-nav">
          {NAV.map(({ to, label, icon: Icon, hash }) => (
            <button
              key={label}
              onClick={() => navigate({ to, hash })}
              className={`sidebar-link ${(hash ? pathname === "/dashboard" && currentHash.replace(/^#/, "") === hash : pathname === to) ? "active" : ""}`}
            >
              <Icon size={17} /> {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {email && (
            <span className="sidebar-email" title={email}>
              {email}
            </span>
          )}
          <button className="sidebar-link" onClick={toggleTheme}>
            {dark ? <Sun size={17} /> : <Moon size={17} />}
            {dark ? "Light appearance" : "Dark appearance"}
          </button>
          <button className="sidebar-link" onClick={handleSignOut}>
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </header>
      <nav className="mobile-nav">
        {NAV.filter((item) =>
          ["Dashboard", "Verify image", "Verification History", "Settings"].includes(item.label),
        ).map(({ to, label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => navigate({ to })}
            className={pathname === to ? "active" : ""}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
