import { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import logoPath from "@assets/chan-corp-logo-white.png";

// Fixed starfield — generated once at module load so it never reshuffles on re-render.
const STARS = Array.from({ length: 70 }).map((_, i) => {
  const seed = i * 137.5;
  const rand = (n: number) => {
    const x = Math.sin(seed + n * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  return {
    left: `${rand(1) * 100}%`,
    top: `${rand(2) * 100}%`,
    size: 1 + rand(3) * 2,
    delay: `${rand(4) * 3.2}s`,
    duration: `${2.4 + rand(5) * 2.4}s`,
    max: 0.35 + rand(6) * 0.65,
  };
});

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showProgressBar, setShowProgressBar] = useState(false);

  function playErrorSound() {
    // Audio files were not included in the deploy repo. Intentionally no-op to keep build and runtime safe.
  }

  function playSuccessSound() {
    // Audio files were not included in the deploy repo. Intentionally no-op to keep build and runtime safe.
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/local/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        playErrorSound();
        toast({ title: "Login failed", description: data.message, variant: "destructive" });
        return;
      }
      playSuccessSound();
      setShowProgressBar(true);
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      await new Promise((r) => setTimeout(r, 1700));
      setLocation("/dashboard");
    } catch {
      playErrorSound();
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{
      background: "#000",
      minHeight: "100vh",
      backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.18) 0%, transparent 65%), radial-gradient(ellipse at 80% 80%, rgba(99,102,241,0.08) 0%, transparent 50%)",
      position: "relative",
      overflow: "hidden",
    }} className="flex flex-col items-center justify-center px-4">

      {/* Drifting glow orbs */}
      <div className="chan-orb" style={{
        width: 340, height: 340, top: "8%", left: "10%",
        background: "radial-gradient(circle, rgba(124,58,237,0.35), transparent 70%)",
        animation: "chan-orb-drift-1 14s ease-in-out infinite",
      }} />
      <div className="chan-orb" style={{
        width: 300, height: 300, bottom: "6%", right: "8%",
        background: "radial-gradient(circle, rgba(0,191,255,0.22), transparent 70%)",
        animation: "chan-orb-drift-2 18s ease-in-out infinite",
      }} />

      {/* Twinkling starfield */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {STARS.map((s, i) => (
          <span
            key={i}
            className="chan-star"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
              animationDuration: s.duration,
              ["--s-max" as any]: s.max,
            }}
          />
        ))}
      </div>

      {/* Post-login horizontal loading bar */}
      {showProgressBar && (
        <div className="login-progress-bar-track" data-testid="login-progress-bar">
          <div className="login-progress-bar-fill" />
        </div>
      )}

      <div className="w-full chan-scale-in" style={{ maxWidth: 380, position: "relative", zIndex: 1 }}>
        <div className="chancorp-glow-wrap">
          <div className="chancorp-card" style={{ padding: "40px 32px 36px" }}>

            {/* Logo + Brand */}
            <div style={{ textAlign: "center", marginBottom: 26 }}>
              <img
                src={logoPath}
                alt="CHAN CORPORATION"
                data-testid="text-brand"
                className="chan-logo-anim"
                style={{
                  width: "100%",
                  maxWidth: 260,
                  height: "auto",
                  margin: "0 auto 10px",
                  display: "block",
                }}
              />
              <p style={{ textAlign: "center", fontSize: 12, color: "#7c6a9c", letterSpacing: "2px", marginTop: 5, textTransform: "uppercase" }}>
                Secure Auth Panel
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="animate-slide-up stagger-1" style={{ display: "flex", flexDirection: "column", gap: 6, opacity: 0 }}>
                <label style={{
                  fontSize: 12, fontWeight: 600, color: "#a78bfa", letterSpacing: "0.5px",
                  textShadow: "0 0 8px rgba(167,139,250,0.70), 0 0 16px rgba(167,139,250,0.40)",
                }}>Username</label>
                <Input
                  data-testid="input-username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(139,92,246,0.25)", color: "#fff", borderRadius: 6 }}
                />
              </div>

              <div className="animate-slide-up stagger-2" style={{ display: "flex", flexDirection: "column", gap: 6, opacity: 0 }}>
                <label style={{
                  fontSize: 12, fontWeight: 600, color: "#a78bfa", letterSpacing: "0.5px",
                  textShadow: "0 0 8px rgba(167,139,250,0.70), 0 0 16px rgba(167,139,250,0.40)",
                }}>Password</label>
                <Input
                  data-testid="input-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(139,92,246,0.25)", color: "#fff", borderRadius: 6 }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !username.trim() || !password}
                data-testid="button-submit-login"
                className="animate-slide-up stagger-3"
                style={{
                  marginTop: 6,
                  position: "relative",
                  overflow: "hidden",
                  opacity: 0,
                  background: isLoading || !username.trim() || !password
                    ? "rgba(124,58,237,0.4)"
                    : "linear-gradient(135deg, #7c3aed, #6366f1)",
                  border: "none",
                  color: "#fff",
                  borderRadius: 6,
                  padding: "12px 0",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  cursor: isLoading || !username.trim() || !password ? "not-allowed" : "pointer",
                  boxShadow: isLoading || !username.trim() || !password
                    ? "none"
                    : "0 0 18px rgba(139,92,246,0.70), 0 0 36px rgba(124,58,237,0.40), 0 4px 18px rgba(124,58,237,0.35)",
                  transition: "opacity 0.2s, transform 0.15s, box-shadow 0.2s",
                  transform: "perspective(400px) translateZ(2px)",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = "perspective(400px) translateZ(4px) translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 0 24px rgba(139,92,246,0.80), 0 0 50px rgba(124,58,237,0.50), 0 6px 24px rgba(124,58,237,0.45)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "perspective(400px) translateZ(2px)";
                  e.currentTarget.style.boxShadow = isLoading || !username.trim() || !password
                    ? "none"
                    : "0 0 18px rgba(139,92,246,0.70), 0 0 36px rgba(124,58,237,0.40), 0 4px 18px rgba(124,58,237,0.35)";
                }}
              >
                {!isLoading && username.trim() && password && <span className="chan-btn-sheen" />}
                <span style={{ position: "relative", zIndex: 1 }}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </span>
              </button>
            </form>

            <p className="animate-fade-in stagger-4" style={{ textAlign: "center", fontSize: 11, color: "#2a1a3e", marginTop: 22, opacity: 0 }}>
              &copy; 2026 CHAN CORPORATION &mdash; Secure Auth Panel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}