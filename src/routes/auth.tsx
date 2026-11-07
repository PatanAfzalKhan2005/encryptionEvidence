import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, AlertCircle, Loader2, ArrowRight, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import AuthSplit from "@/components/fx/AuthSplit";
import ImageSealLogo from "@/components/fx/ImageSealLogo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    next:
      typeof search["next"] === "string" &&
      search["next"].startsWith("/") &&
      !search["next"].startsWith("//")
        ? search["next"]
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign In — ImageSeal" },
      {
        name: "description",
        content: "Sign in to the ImageSeal image integrity verification portal.",
      },
      { property: "og:title", content: "Sign In — ImageSeal" },
      {
        property: "og:description",
        content: "Sign in to the ImageSeal image integrity verification portal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const continueAfterAuth = useCallback(() => {
    if (next?.startsWith("/verify")) {
      const id = new URLSearchParams(next.split("?")[1] ?? "").get("id");
      navigate({ to: "/verify", search: { id: id ?? undefined }, replace: true });
    } else navigate({ to: "/dashboard", replace: true });
  }, [navigate, next]);

  // Continue to the protected page that triggered sign-in.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) continueAfterAuth();
    });
  }, [continueAfterAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!form.email) return setError("Email address is required.");
    if (!form.password) return setError("Password is required.");
    if (mode === "signup" && form.password.length < 8)
      return setError("Password must be at least 8 characters.");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth${next ? `?next=${encodeURIComponent(next)}` : ""}`,
          },
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        if (data.session) {
          toast.success("Account created.");
          continueAfterAuth();
        } else {
          setNotice("Account created. Check your inbox for a confirmation link, then sign in.");
          setMode("signin");
        }
        return;
      }
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (authError || !data.user) {
        setError(
          authError?.message === "Email not confirmed"
            ? "Please confirm your email first — check your inbox for the confirmation link."
            : authError?.message || "Authentication failed. Please check your credentials.",
        );
        return;
      }
      toast.success("Welcome back!");
      continueAfterAuth();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "ImageSeal could not reach the authentication service. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplit>
      <div className="sg-card-inner">
        <div className="sg-card-logo">
          <ImageSealLogo size={52} />
        </div>
        <div className="sg-card-head">
          <h2>{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
          <p>
            {mode === "signin"
              ? "Sign in to your private image integrity workspace"
              : "Your images and hashes are stored privately under your account"}
          </p>
        </div>

        {notice && <div className="sg-alert ok">{notice}</div>}

        {error && (
          <div className="sg-alert bad" role="alert">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="sg-form" noValidate>
          <label className="sg-field">
            <span>Email address</span>
            <div className="sg-input">
              <Mail size={16} />
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>
          </label>

          <label className="sg-field">
            <span>Password</span>
            <div className="sg-input">
              <Lock size={16} />
              <input
                type={showPw ? "text" : "password"}
                placeholder={mode === "signin" ? "Enter your password" : "At least 8 characters"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                className="sg-eye"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <button type="submit" className="sg-submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />{" "}
                {mode === "signin" ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              <>
                {mode === "signin" ? "Sign In" : "Create Account"} <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <p className="sg-switch">
          {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
              setNotice("");
            }}
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </AuthSplit>
  );
}
