import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { login, register } from "../lib/authApi";

type Mode = "login" | "signup";

interface AuthPageProps {
  /** Chamado com o utilizador autenticado assim que o login/registo tem sucesso */
  onAuthenticated: (user: { id: string; username: string; email: string }) => void;
}

export default function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user =
        mode === "login"
          ? await login(email, password)
          : await register(username, email, password);
      onAuthenticated(user);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-600 selection:text-white border-t-4 border-indigo-600">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-8">

        {/* Brand — mesma marca do header principal */}
        <div className="flex items-center justify-center gap-3 mb-7">
          <div className="w-8 h-8 bg-indigo-600 flex items-center justify-center rounded shadow-xs shrink-0">
            <div className="w-3.5 h-3.5 bg-white rotate-45"></div>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-50 tracking-tight leading-tight font-display">BetTrackr</h1>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Gestão de Apostas</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mb-6" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            onClick={() => switchMode("login")}
            className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${
              mode === "login" ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            onClick={() => switchMode("signup")}
            className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${
              mode === "signup" ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence initial={false}>
            {mode === "signup" && (
              <motion.label
                key="username-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="block overflow-hidden"
              >
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Username</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="o_teu_username"
                  autoComplete="username"
                  required
                  minLength={3}
                  className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/15 focus:border-indigo-600 transition-colors"
                />
              </motion.label>
            )}
          </AnimatePresence>

          <label className="block">
            <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@exemplo.com"
              autoComplete="email"
              required
              className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/15 focus:border-indigo-600 transition-colors"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={8}
              className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/15 focus:border-indigo-600 transition-colors"
            />
            {mode === "signup" && (
              <span className="block text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">Mínimo 8 caracteres.</span>
            )}
          </label>

          {error && (
            <div role="alert" className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 text-xs font-medium rounded-lg px-3 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-lg py-2.5 transition-colors"
          >
            {loading ? "Aguarda…" : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-5">
          {mode === "login" ? (
            <>
              Ainda não tens conta?{" "}
              <button type="button" onClick={() => switchMode("signup")} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300">
                Regista-te
              </button>
            </>
          ) : (
            <>
              Já tens conta?{" "}
              <button type="button" onClick={() => switchMode("login")} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300">
                Inicia sessão
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
