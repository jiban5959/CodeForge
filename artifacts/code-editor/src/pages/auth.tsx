import React, { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Code2, Mail, Lock, User, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function Auth() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [isSignUp, setIsSignUp] = useState(params.get("mode") === "signup");
  const [flipping, setFlipping] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();

  const flip = (toSignUp: boolean) => {
    if (flipping || isSignUp === toSignUp) return;
    setFlipping(true);
    setTimeout(() => {
      setIsSignUp(toSignUp);
      setFlipping(false);
    }, 350);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation("/dashboard");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "#020c0e" }}
    >
      {/* Grid bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(45,212,191,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,0.05) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow orbs */}
      <div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold">
            <Code2 className="h-6 w-6 text-teal-400" />
            <span className="text-white">Code<span className="text-teal-400">Forge</span></span>
          </Link>
        </div>

        {/* Toggle tabs */}
        <div className="flex mb-6 p-1 rounded-xl border border-teal-900/50 bg-[#040f11]">
          <button
            onClick={() => flip(false)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
              !isSignUp
                ? "bg-teal-500 text-black shadow-[0_0_15px_rgba(45,212,191,0.3)]"
                : "text-gray-500 hover:text-teal-400"
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => flip(true)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
              isSignUp
                ? "bg-teal-500 text-black shadow-[0_0_15px_rgba(45,212,191,0.3)]"
                : "text-gray-500 hover:text-teal-400"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Card with flip */}
        <div
          style={{
            perspective: "1000px",
            height: isSignUp ? "460px" : "400px",
            transition: "height 0.5s ease",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              position: "relative",
              transformStyle: "preserve-3d",
              transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: isSignUp ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* LOGIN FACE (front) */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            >
              <form
                onSubmit={handleSubmit}
                className="h-full p-8 rounded-2xl border border-teal-900/50 bg-[#040f11] flex flex-col gap-5 shadow-[0_0_60px_rgba(45,212,191,0.05)]"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
                  <p className="text-sm text-gray-500">Sign in to your CodeForge account</p>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs text-teal-400 font-medium mb-1.5 uppercase tracking-wider">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0a1a1c] border border-teal-900/60 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500 focus:shadow-[0_0_0_2px_rgba(45,212,191,0.15)] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-teal-400 font-medium mb-1.5 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-[#0a1a1c] border border-teal-900/60 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500 focus:shadow-[0_0_0_2px_rgba(45,212,191,0.15)] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-teal-400 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-gray-500 cursor-pointer">
                    <input type="checkbox" className="accent-teal-500" />
                    Remember me
                  </label>
                  <button type="button" className="text-teal-500 hover:text-teal-400 transition-colors">
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 font-semibold bg-teal-500 text-black rounded-xl hover:bg-teal-400 transition-all shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_30px_rgba(45,212,191,0.5)] mt-auto"
                >
                  Sign In
                </button>

                <p className="text-center text-sm text-gray-600">
                  Don't have an account?{" "}
                  <button type="button" onClick={() => flip(true)} className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
                    Sign up free
                  </button>
                </p>
              </form>
            </div>

            {/* SIGNUP FACE (back — rotated 180°) */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <form
                onSubmit={handleSubmit}
                className="h-full p-8 rounded-2xl border border-teal-900/50 bg-[#040f11] flex flex-col gap-4 shadow-[0_0_60px_rgba(45,212,191,0.05)]"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Create account</h2>
                  <p className="text-sm text-gray-500">Join thousands of developers on CodeForge</p>
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs text-teal-400 font-medium mb-1.5 uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                      <input
                        type="text"
                        required
                        placeholder="Ada Lovelace"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0a1a1c] border border-teal-900/60 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500 focus:shadow-[0_0_0_2px_rgba(45,212,191,0.15)] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-teal-400 font-medium mb-1.5 uppercase tracking-wider">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0a1a1c] border border-teal-900/60 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500 focus:shadow-[0_0_0_2px_rgba(45,212,191,0.15)] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-teal-400 font-medium mb-1.5 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Min. 8 characters"
                        className="w-full pl-10 pr-10 py-2.5 bg-[#0a1a1c] border border-teal-900/60 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500 focus:shadow-[0_0_0_2px_rgba(45,212,191,0.15)] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-teal-400 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <label className="flex items-start gap-2 text-xs text-gray-500 cursor-pointer">
                  <input type="checkbox" required className="accent-teal-500 mt-0.5" />
                  <span>I agree to the <span className="text-teal-500">Terms of Service</span> and <span className="text-teal-500">Privacy Policy</span></span>
                </label>

                <button
                  type="submit"
                  className="w-full py-3 font-semibold bg-teal-500 text-black rounded-xl hover:bg-teal-400 transition-all shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_30px_rgba(45,212,191,0.5)] mt-auto"
                >
                  Create Account
                </button>

                <p className="text-center text-sm text-gray-600">
                  Already have an account?{" "}
                  <button type="button" onClick={() => flip(false)} className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
                    Log in
                  </button>
                </p>
              </form>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">
          <Link href="/dashboard" className="hover:text-teal-500 transition-colors">
            ← Continue without account
          </Link>
        </p>
      </div>
    </div>
  );
}
