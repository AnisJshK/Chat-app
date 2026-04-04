import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

type AuthMode = "login" | "Register";
interface ApiError {
  message: string;
}

const API_BASE = "http://localhost:3001";

export default function Authpage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [animating, setAnimating] = useState(false);

  function switchMode(next: AuthMode) {
    if (next === mode || animating) return;
    setAnimating(true);
    setError("");
    setSuccess("");
    setEmail("");
    setPassword("");
    setTimeout(() => {
      setMode(next);
      setAnimating(false);
    }, 180);
  }

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(t);
  }, [error]);

  function validate(): boolean {
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!password) {
      setError("Password is required");
      return false;
    }
    if (mode === "Register" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return false;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validate()) return;
    setLoading(true);
    const endpoint = mode === "login" ? "/user/signin" : "/user/signup";

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data: { token?: string; userId?: string } & ApiError =
        await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong. Please try again");
        return;
      }

      if (mode === "login") {
        localStorage.setItem("token", data.token ?? "");
        setSuccess("Welcome back! Redirecting...");
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        setSuccess("Account created! Please sign in.");
        setTimeout(() => switchMode("login"), 1200);
      }
    } catch {
      setError("Unable to reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-black px-4 py-10">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-violet-700/10 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-blue-600/5 blur-[80px]" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8 select-none">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/30">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Chat<span className="text-indigo-400">Nova</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {mode === "login" ? "Sign in to continue chatting" : "Create your free account"}
          </p>
        </div>

        {/* Main card */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800/60 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Mode tabs */}
          <div className="flex border-b border-gray-800/60">
            {(["login", "register"] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-4 text-sm font-semibold tracking-wide transition-all duration-200 relative ${
                  mode === m
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {m === "login" ? "Login" : "Register"}
                {/* Active indicator */}
                <span
                  className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 ${
                    mode === m ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                  }`}
                  style={{ transformOrigin: "center" }}
                />
              </button>
            ))}
          </div>

          {/* Form wrapper with fade transition */}
          <div
            className="transition-all duration-180"
            style={{ opacity: animating ? 0 : 1, transform: animating ? "translateY(6px)" : "translateY(0)" }}
          >
            <div className="px-7 pt-7 pb-8">
              {/* Heading */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">
                  {mode === "login" ? "Welcome back" : "Create account"}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {mode === "login"
                    ? "Enter your credentials to access your account."
                    : "Fill in the details below to get started."}
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-gray-600">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      disabled={loading}
                      className="w-full bg-gray-800/60 border border-gray-700/60 text-white text-sm rounded-xl pl-10 pr-4 py-3 outline-none placeholder:text-gray-600 focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-600/60"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-gray-600">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === "Register" ? "Min. 8 characters" : "••••••••"}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      disabled={loading}
                      className="w-full bg-gray-800/60 border border-gray-700/60 text-white text-sm rounded-xl pl-10 pr-4 py-3 outline-none placeholder:text-gray-600 focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-600/60"
                    />
                  </div>
                </div>

                {/* Error banner */}
                {error && (
                  <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* Success banner */}
                {success && (
                  <div className="flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-400 text-sm">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{success}</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 mt-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold tracking-wide shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      {mode === "login" ? "Signing in..." : "Creating account..."}
                    </>
                  ) : mode === "login" ? (
                    "Login"
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              {/* Mode switch link */}
              <p className="text-center text-gray-500 text-sm mt-6">
                {mode === "login" ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      onClick={() => switchMode("Register")}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors duration-150 hover:underline underline-offset-2"
                    >
                      Register
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      onClick={() => switchMode("login")}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors duration-150 hover:underline underline-offset-2"
                    >
                      Login
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-gray-700 text-xs mt-6">
          By continuing, you agree to ChatNova's{" "}
          <span className="text-gray-500 cursor-pointer hover:text-gray-400 transition-colors">Terms</span>{" "}
          and{" "}
          <span className="text-gray-500 cursor-pointer hover:text-gray-400 transition-colors">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );

}
