import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { login, register } from "../lib/authApi";
import { BrandMark } from "../App";

type Mode = "login" | "signup";

interface AuthPageProps {
  /** Chamado com o utilizador autenticado assim que o login/registo tem sucesso */
  onAuthenticated: (user: { id: string; username: string; email: string }) => void;
}

const INPUT_CLASSES =
  "w-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-sm px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors";

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
    <div className="relative min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center p-6 font-sans text-zinc-900 dark:text-zinc-100 antialiased selection:bg-emerald-500/90 selection:text-zinc-950 overflow-hidden">

      {/* Fundo: grelha subtil de terminal + brilho esmeralda difuso */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.22]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgb(113 113 122 / 0.14) 1px, transparent 1px), linear-gradient(to bottom, rgb(113 113 122 / 0.14) 1px, transparent 1px)",
          backgroundSize: "36px 36px"
        }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full bg-emerald-500/10 dark:bg-emerald-500/8 blur-3xl" />

      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm shadow-xl shadow-zinc-950/5 dark:shadow-black/30 p-8">

        {/* Marca — mesmo desenho do ícone da app */}
        <div className="flex flex-col items-center gap-3 mb-7">
          <BrandMark size={52} />
          <div className="text-center">
            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight font-display">BetTrackr</h1>
            <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-[0.22em] font-mono mt-0.5">Gestão de Apostas</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-sm p-1 mb-6" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            onClick={() => switchMode("login")}
            className={`flex-1 py-2 rounded-xs text-xs font-semibold transition-colors cursor-pointer ${
              mode === "login" ? "bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 shadow-xs" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            onClick={() => switchMode("signup")}
            className={`flex-1 py-2 rounded-xs text-xs font-semibold transition-colors cursor-pointer ${
              mode === "signup" ? "bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 shadow-xs" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
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
                <span className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1.5 font-mono">Username</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="o_teu_username"
                  autoComplete="username"
                  required
                  minLength={3}
                  className={INPUT_CLASSES}
                />
              </motion.label>
            )}
          </AnimatePresence>

          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1.5 font-mono">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@exemplo.com"
              autoComplete="email"
              required
              className={INPUT_CLASSES}
            />
          </label>

          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1.5 font-mono">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={8}
              className={INPUT_CLASSES}
            />
            {mode === "signup" && (
              <span className="block text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5">Mínimo 8 caracteres.</span>
            )}
          </label>

          {error && (
            <div role="alert" className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 text-xs font-medium rounded-sm px-3 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-sm py-2.5 transition-colors cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            {loading ? "Aguarda…" : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-5">
          {mode === "login" ? (
            <>
              Ainda não tens conta?{" "}
              <button type="button" onClick={() => switchMode("signup")} className="text-emerald-600 dark:text-emerald-400 font-semibold hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer">
                Regista-te
              </button>
            </>
          ) : (
            <>
              Já tens conta?{" "}
              <button type="button" onClick={() => switchMode("login")} className="text-emerald-600 dark:text-emerald-400 font-semibold hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer">
                Inicia sessão
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
