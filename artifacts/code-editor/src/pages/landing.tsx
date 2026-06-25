import React, { useEffect, useRef } from "react";
import { Link } from "wouter";
import { Code2, Zap, Globe, Lock, Terminal, Cpu, ArrowRight, Play, ChevronRight } from "lucide-react";

const FEATURES = [
  {
    icon: <Code2 className="h-6 w-6" />,
    title: "Monaco Editor",
    desc: "VS Code-level intelligence — syntax highlighting, IntelliSense, and multi-language support built in.",
  },
  {
    icon: <Play className="h-6 w-6" />,
    title: "Live Preview",
    desc: "Instantly see your HTML/CSS/JS render in real-time as you type, with zero configuration needed.",
  },
  {
    icon: <Terminal className="h-6 w-6" />,
    title: "Server-Side Execution",
    desc: "Run Python, Node.js, TypeScript, and Bash directly in the cloud. Full stdout/stderr output.",
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Multi-Language",
    desc: "HTML, CSS, JavaScript, TypeScript, React, Python — one environment for every language you need.",
  },
  {
    icon: <Cpu className="h-6 w-6" />,
    title: "Project Management",
    desc: "Organize code into projects with multiple files, auto-save, and instant access from the dashboard.",
  },
  {
    icon: <Lock className="h-6 w-6" />,
    title: "Cloud Storage",
    desc: "Every file persists in a PostgreSQL database. Your code is always safe, always accessible.",
  },
];

const LANGUAGES_DEMO = ["JavaScript", "Python", "TypeScript", "React", "HTML/CSS", "Bash"];

export default function Landing() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; alpha: number; size: number }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.5 + 0.1,
        size: Math.random() * 2 + 1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(45, 212, 191, ${p.alpha})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(45, 212, 191, ${0.15 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#020c0e] text-white overflow-x-hidden">
      {/* Animated canvas background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(45,212,191,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div className="relative" style={{ zIndex: 2 }}>
        {/* Nav */}
        <nav className="flex items-center justify-between px-8 py-5 border-b border-teal-900/40">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Code2 className="h-6 w-6 text-teal-400" />
            <span className="text-white">Code<span className="text-teal-400">Forge</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth">
              <button className="px-4 py-2 text-sm text-teal-400 border border-teal-800 rounded-lg hover:border-teal-500 hover:bg-teal-950/50 transition-all">
                Log In
              </button>
            </Link>
            <Link href="/auth?mode=signup">
              <button className="px-4 py-2 text-sm font-medium bg-teal-500 text-black rounded-lg hover:bg-teal-400 transition-all shadow-[0_0_20px_rgba(45,212,191,0.3)]">
                Get Started
              </button>
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="flex flex-col items-center text-center px-6 pt-24 pb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-teal-700/60 bg-teal-950/40 text-teal-400 text-sm">
            <Zap className="h-3.5 w-3.5" />
            <span>Next-Generation Cloud IDE</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight max-w-4xl leading-none mb-6">
            Code the
            <span
              className="block"
              style={{
                background: "linear-gradient(90deg, #2dd4bf, #06b6d4, #818cf8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Future.
            </span>
          </h1>

          <p className="text-lg text-gray-400 max-w-xl mb-10 leading-relaxed">
            A powerful cloud IDE built for modern developers. Write, run, and ship code in
            Python, JavaScript, TypeScript, React, and more — all from your browser.
          </p>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link href="/auth?mode=signup">
              <button className="group flex items-center gap-2 px-6 py-3 font-semibold bg-teal-500 text-black rounded-xl hover:bg-teal-400 transition-all shadow-[0_0_30px_rgba(45,212,191,0.4)] hover:shadow-[0_0_40px_rgba(45,212,191,0.6)]">
                Start Coding Free
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="flex items-center gap-2 px-6 py-3 font-semibold border border-gray-700 rounded-xl hover:border-teal-700 hover:text-teal-400 transition-all text-gray-300">
                Open Dashboard
                <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
          </div>

          {/* Language pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-12">
            {LANGUAGES_DEMO.map((lang) => (
              <span
                key={lang}
                className="px-3 py-1 text-xs rounded-full border border-teal-900/60 bg-teal-950/30 text-teal-300"
              >
                {lang}
              </span>
            ))}
          </div>
        </section>

        {/* Fake editor preview */}
        <section className="px-6 pb-20 max-w-5xl mx-auto">
          <div className="rounded-2xl border border-teal-900/50 bg-[#040f11] overflow-hidden shadow-[0_0_80px_rgba(45,212,191,0.08)]">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-teal-900/40 bg-[#030d0f]">
              <div className="h-3 w-3 rounded-full bg-red-500/70" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <div className="h-3 w-3 rounded-full bg-green-500/70" />
              <span className="ml-3 text-xs text-teal-700 font-mono">main.py — CodeForge</span>
            </div>
            <div className="p-6 font-mono text-sm leading-relaxed overflow-hidden">
              <div className="flex gap-6">
                <div className="text-gray-600 select-none text-right w-6 shrink-0">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <div key={n}>{n}</div>)}
                </div>
                <div>
                  <div><span className="text-purple-400">def</span> <span className="text-teal-400">fibonacci</span><span className="text-gray-300">(n):</span></div>
                  <div className="pl-4"><span className="text-blue-400">if</span> <span className="text-gray-300">n &lt;= 1:</span></div>
                  <div className="pl-8"><span className="text-blue-400">return</span> <span className="text-orange-400">n</span></div>
                  <div className="pl-4"><span className="text-blue-400">return</span> <span className="text-teal-400">fibonacci</span><span className="text-gray-300">(n - 1) + </span><span className="text-teal-400">fibonacci</span><span className="text-gray-300">(n - 2)</span></div>
                  <div>&nbsp;</div>
                  <div><span className="text-gray-500"># Generate sequence</span></div>
                  <div><span className="text-gray-300">sequence = [</span><span className="text-teal-400">fibonacci</span><span className="text-gray-300">(i) </span><span className="text-blue-400">for</span><span className="text-gray-300"> i </span><span className="text-blue-400">in</span><span className="text-orange-400"> range</span><span className="text-gray-300">(10)]</span></div>
                  <div><span className="text-orange-400">print</span><span className="text-gray-300">(</span><span className="text-green-400">f"Fibonacci: </span><span className="text-teal-400">{"{"}</span><span className="text-gray-300">sequence</span><span className="text-teal-400">{"}"}</span><span className="text-green-400">"</span><span className="text-gray-300">)</span></div>
                  <div>&nbsp;</div>
                  <div className="text-gray-600"><span className="text-teal-500 animate-pulse">█</span></div>
                </div>
              </div>
            </div>
            <div className="border-t border-teal-900/40 bg-[#030d0f] px-6 py-3">
              <div className="text-xs text-teal-500 font-mono">▶ Output</div>
              <div className="text-xs text-gray-400 font-mono mt-1">Fibonacci: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]</div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 pb-24 max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Everything you need to{" "}
              <span className="text-teal-400">ship faster</span>
            </h2>
            <p className="text-gray-500">Built for developers who demand performance and elegance.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="group relative p-6 rounded-2xl border border-teal-900/40 bg-[#040f11] hover:border-teal-600/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(45,212,191,0.06)]"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-teal-950 border border-teal-800/60 text-teal-400 mb-4">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <section className="px-6 pb-24">
          <div className="max-w-3xl mx-auto text-center p-12 rounded-3xl border border-teal-800/40 bg-gradient-to-br from-teal-950/60 to-[#020c0e] shadow-[0_0_60px_rgba(45,212,191,0.07)]">
            <h2 className="text-3xl font-bold mb-4">Ready to forge your code?</h2>
            <p className="text-gray-400 mb-8">Join developers building the future — no setup, no installs, just code.</p>
            <Link href="/auth?mode=signup">
              <button className="px-8 py-3.5 font-semibold bg-teal-500 text-black rounded-xl hover:bg-teal-400 transition-all shadow-[0_0_30px_rgba(45,212,191,0.4)] text-lg">
                Create Free Account
              </button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-teal-900/30 px-8 py-6 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-teal-800" />
            <span>CodeForge © 2026</span>
          </div>
          <span>Built for the future.</span>
        </footer>
      </div>
    </div>
  );
}
