import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Moon, Sun, ShieldCheck, Hash } from "lucide-react";
import AppHeader from "@/components/fx/AppHeader";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

function SettingsPage() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(localStorage.getItem("imageseal-theme") === "dark"), []);
  const setTheme = (value: boolean) => {
    setDark(value);
    localStorage.setItem("imageseal-theme", value ? "dark" : "light");
    document.documentElement.classList.toggle("theme-dark", value);
  };
  return (
    <div className="min-h-screen bg-surface-900">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <header>
          <p className="eyebrow">PREFERENCES</p>
          <h1 className="text-2xl font-bold text-slate-50">Settings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage the appearance and understand how ImageSeal protects image integrity.
          </p>
        </header>
        <section className="card p-5">
          <h2 className="card-title">Appearance</h2>
          <p className="text-sm text-slate-500 mt-1">
            Choose the workspace theme. Your preference is saved in this browser.
          </p>
          <button className="btn-outline mt-4" onClick={() => setTheme(!dark)}>
            {dark ? <Sun size={15} /> : <Moon size={15} />}{" "}
            {dark ? "Switch to light mode" : "Switch to dark mode"}
          </button>
        </section>
        <section className="card p-5">
          <div className="flex items-start gap-3">
            <Hash className="text-accent mt-1" size={19} />
            <div>
              <h2 className="card-title">Exact SHA-256 verification</h2>
              <p className="text-sm text-slate-500 mt-1">
                ImageSeal hashes the exact uploaded file using Web Crypto SHA-256. A match means
                byte-for-byte identical content. Hashing is not encryption.
              </p>
            </div>
          </div>
        </section>
        <section className="card p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="text-forensic-green mt-1" size={19} />
            <div>
              <h2 className="card-title">Private image storage</h2>
              <p className="text-sm text-slate-500 mt-1">
                Images are kept in the existing private storage bucket. Access is scoped to your
                signed-in account and served through temporary signed links.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
