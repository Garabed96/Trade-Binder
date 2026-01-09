"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Input } from "@trade-binder/ui";
import { trpc } from "@/src/utils/trpc";
import { Navbar } from "@/src/components/Navbar";

export default function RegisterPage() {
  const { t } = useTranslation(["common"]);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const createUser = trpc.user.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await createUser.mutateAsync({ username, email, password });
      router.push(`/${locale}/login?registered=true`);
    } catch (err: unknown) {
      // Narrowing the type to access .message safely
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background flex min-h-screen flex-col dark:bg-transparent">
      <Navbar minimal />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-200/50 bg-white/70 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/40">
          <div>
            <h2 className="mt-6 text-center text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {t("createAccount")}
            </h2>
            <p className="mt-2 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
              Join the community of collectors
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                <div className="text-center text-sm font-bold text-red-600 dark:text-red-400">
                  {error}
                </div>
              </div>
            )}
            <div className="space-y-4">
              <div className="group relative">
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={t("username")}
                />
              </div>
              <div className="group relative">
                <Input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t("email")}
                />
              </div>
              <div className="group relative">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t("password")}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-2xl bg-blue-600 px-4 py-4 text-sm font-black tracking-widest text-white uppercase shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:bg-blue-500 active:scale-95 disabled:translate-y-0 disabled:opacity-50"
              >
                {loading ? "Registering..." : t("signUp")}
              </button>
            </div>

            <div className="text-center">
              <Link
                href={`/${locale}/login`}
                className="text-xs font-black tracking-widest text-blue-600 uppercase transition-colors hover:text-blue-500 dark:text-blue-400"
              >
                {t("alreadyHaveAccount")} {t("signIn")}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
