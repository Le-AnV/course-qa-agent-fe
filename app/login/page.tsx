"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  AUTH_ROLE_KEY,
  AUTH_TOKEN_KEY,
  homeRouteFor,
  type Role,
} from "@/components/ui/nav-config";
import { InteractiveBookshelf } from "@/features/login/interactive-bookshelf";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectNotice, setRedirectNotice] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRedirectNotice(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier || !password.trim()) {
      setError("Please enter both email/username and password.");
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // DB login only (AI-25): POST /api/auth/login {email, password}.
      // No mock fallback — a failed login must surface here instead of issuing
      // a fake session that later bounces on the first real API call.
      let role: Role | null = null;
      let token: string | null = null;
      try {
        const dbRes = await fetch(`${apiUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanIdentifier, password }),
        });
        if (dbRes.ok) {
          const data = await dbRes.json();
          role = data.role as Role;
          token = data.access_token as string;
        } else if (dbRes.status === 401) {
          const errData = await dbRes.json().catch(() => null);
          setError(errData?.detail || "Invalid email or password.");
          return;
        }
      } catch {
        setError("Unable to connect to the authentication service. Please verify your connection.");
        return;
      }

      if (role && token) {
        setRedirectNotice("Authentication successful. Redirecting to your dashboard...");
        setTimeout(() => {
          localStorage.setItem(AUTH_TOKEN_KEY, token as string);
          localStorage.setItem(AUTH_ROLE_KEY, role as string);
          // Set cookies for Next.js Middleware Edge Route Guarding
          document.cookie = `${AUTH_ROLE_KEY}=${role}; path=/`;
          document.cookie = `${AUTH_TOKEN_KEY}=${token}; path=/`;
          window.location.assign(homeRouteFor(role as Role));
        }, 600);
      } else {
        setError("Invalid email or password.");
      }
    } catch {
      setError("Unable to connect to the authentication service. Please verify your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex overflow-hidden bg-white text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* CỘT TRÁI (60% - BÀN HỌC TƯƠNG TÁC) */}
      <section className="hidden lg:flex lg:w-[60%] relative h-full overflow-hidden">
        <InteractiveBookshelf />
      </section>

      {/* CỘT PHẢI (40% - LOGIN FORM) */}
      <section className="w-full lg:w-[40%] h-full bg-white flex flex-col justify-between p-6 sm:p-8 lg:p-10 relative border-l border-slate-200/80 shadow-xl lg:shadow-none">
        {/* Top Header Bar */}
        <header className="w-full flex items-center justify-between shrink-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors group py-1"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold shadow-2xs">
            <GraduationCap className="w-4 h-4" />
            <span>Academic Portal</span>
          </div>
        </header>

        {/* Center: Auth Form Container with Enriched Typography & Larger Inputs */}
        <main className="w-full max-w-[390px] sm:max-w-[410px] mx-auto my-auto py-2 sm:py-3">
          {/* Welcome Header */}
          <div className="mb-5 sm:mb-6">
            <div className="w-12 h-12 rounded-[12px] bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30 mb-3.5 ring-4 ring-blue-50">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-heading">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              Sign in to your academic portal to access syllabus Q&amp;A, verified course materials, and AI study companion.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-[8px] border border-red-200 bg-red-50/95 p-3 text-xs sm:text-sm text-red-800 animate-in fade-in duration-150"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span className="font-medium leading-tight">{error}</span>
            </div>
          )}

          {/* Success / Redirecting Alert */}
          {redirectNotice && (
            <div
              role="status"
              className="mb-4 flex items-center gap-2.5 rounded-[8px] border border-blue-200 bg-blue-50/95 p-3 text-xs sm:text-sm text-blue-800 animate-in fade-in duration-150"
            >
              <Loader2 className="w-4 h-4 shrink-0 text-blue-600 animate-spin" />
              <span className="font-semibold leading-tight">{redirectNotice}</span>
            </div>
          )}

          {/* Form with Rounded-8px Fields and Text */}
          <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
            {/* Email / Username Field */}
            <div>
              <label
                htmlFor="identifier"
                className="block text-xs sm:text-[13px] font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Email or Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@academic.edu.vn"
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-slate-50/90 border border-slate-300 rounded-[8px] text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs sm:text-[13px] font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-11 py-3 sm:py-3.5 bg-slate-50/90 border border-slate-300 rounded-[8px] text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 sm:py-3.5 px-5 rounded-[8px] bg-[#2B59C3] hover:bg-[#20459c] active:bg-[#1a3880] text-white font-semibold text-sm sm:text-base shadow-sm shadow-[#2B59C3]/30 hover:shadow-md hover:shadow-[#2B59C3]/40 transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Administrator Notice */}
          <p className="mt-4 text-center text-xs sm:text-[13px] text-slate-500 leading-relaxed">
            Don&apos;t have an account?{" "}
            <span className="font-semibold text-slate-700">
              Account creation is restricted to administrators only.
            </span>
          </p>
        </main>

        {/* Form Footer */}
        <footer className="w-full pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium shrink-0">
          <span>&copy; {new Date().getFullYear()} Course Q&amp;A Syllabus Agent</span>
          <span>Single Sign-On Security</span>
        </footer>
      </section>
    </div>
  );
}
