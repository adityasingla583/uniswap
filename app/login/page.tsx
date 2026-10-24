"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/server/actions";
import { LogIn, Lock, Mail, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-[75vh] items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
            <LogIn className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Sign in to Local Loop
          </h2>
          <p className="text-sm text-muted-foreground">
            Connect with buyers and sellers on your campus
          </p>
        </div>

        {state?.error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-600 dark:text-red-400">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Campus Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                name="email"
                required
                placeholder="alice@mit.edu"
                className="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 px-4 text-sm font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Create an account
          </Link>
        </div>

        <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Demo test accounts:</p>
          <p>Email: <code className="text-foreground">alice@mit.edu</code> / Password: <code className="text-foreground">password123</code></p>
          <p>Email: <code className="text-foreground">bob@harvard.edu</code> / Password: <code className="text-foreground">password123</code></p>
        </div>
      </div>
    </div>
  );
}
