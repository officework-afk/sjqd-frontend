"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useResponsive } from "../components/useResponsive";
import { handleEnterAdvance } from "../components/useEnterAdvance";
import { API_BASE_URL } from "../lib/api";

const API = API_BASE_URL;

const sellingPoints = [
  "Fast sales, purchase and GST billing",
  "Barcode, stock and item master support",
  "Cash, bank, receivable and payment tracking",
  "Responsive browser access for mobile, Mac and desktop",
];

export default function LoginPage() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [otpPreview, setOtpPreview] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [busyAction, setBusyAction] = useState<"" | "password" | "requestOtp" | "otp">("");

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        router.push("/");
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [router]);

  const handleIdentifierChange = (value: string) => {
    setIdentifier(value);
    setOtp("");
    setOtpPreview("");
    setOtpRequested(false);
    setMessage("");
  };

  const finishLogin = (data: any) => {
    localStorage.setItem("token", data.token || "");
    localStorage.setItem("user", JSON.stringify(data.user || {}));
    router.push("/subscription?entry=login");
  };

  const login = async () => {
    setMessage("");

    if (!identifier || !password) {
      setMessage("Email/mobile number and password required");
      return;
    }

    try {
      setBusyAction("password");
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Invalid email/mobile number or password");
        return;
      }

      finishLogin(data);
    } catch {
      setMessage("Server error. Please check backend is running.");
    } finally {
      setBusyAction("");
    }
  };

  const requestOtp = async () => {
    setMessage("");

    if (!identifier) {
      setMessage("Enter email or mobile number first");
      return;
    }

    try {
      setBusyAction("requestOtp");
      const res = await fetch(`${API}/auth/request-login-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Unable to create OTP");
        return;
      }

      setOtpRequested(true);
      setOtpPreview(data.otpPreview || "");
      setMessage(data.message || "OTP created successfully");
    } catch {
      setMessage("Server error. Please check backend is running.");
    } finally {
      setBusyAction("");
    }
  };

  const loginWithOtp = async () => {
    setMessage("");

    if (!identifier || !otp) {
      setMessage("Email/mobile number and OTP required");
      return;
    }

    try {
      setBusyAction("otp");
      const res = await fetch(`${API}/auth/verify-otp-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "OTP login failed");
        return;
      }

      finishLogin(data);
    } catch {
      setMessage("Server error. Please check backend is running.");
    } finally {
      setBusyAction("");
    }
  };

  const forgotPassword = () => {
    void requestOtp();
  };

  return (
    <main style={page}>
      <section
        style={{
          ...shell,
          gridTemplateColumns: isTablet ? "1fr" : "minmax(340px,0.9fr) minmax(360px,0.78fr)",
          padding: isMobile ? 18 : 24,
        }}
      >
        <aside style={{ ...infoPanel, padding: isMobile ? 24 : 34 }}>
          <Link href="/" style={backLink}>
            Back to Home
          </Link>

          <div style={brandRow}>
            <div style={logoWrap}>
              <Image
                src="/logo.png"
                alt="SJQD Software Logo"
                width={110}
                height={110}
                priority
                style={logo}
              />
            </div>
            <div>
              <div style={brandEyebrow}>SJQD Software</div>
              <h1 style={{ ...brandTitle, fontSize: isMobile ? 38 : 52 }}>
                Professional billing and business control
              </h1>
            </div>
          </div>

          <p style={brandText}>
            Login to manage billing, GST, barcode flow, stock, party masters and
            accounts from one clean business dashboard.
          </p>

          <div style={pointGrid}>
            {sellingPoints.map((item) => (
              <div key={item} style={pointCard}>
                {item}
              </div>
            ))}
          </div>
        </aside>

        <section
          style={{ ...card, padding: isMobile ? 24 : 38 }}
          onKeyDown={handleEnterAdvance}
        >
          <h2 style={{ ...title, fontSize: isMobile ? 38 : 48 }}>Welcome Back</h2>
          <p style={subtitle}>Login using password or OTP with email/mobile number</p>

          <label style={label}>Email or Mobile Number</label>
          <input
            style={input}
            placeholder="Enter email or mobile number"
            value={identifier}
            autoComplete="username"
            onChange={(e) => handleIdentifierChange(e.target.value)}
          />

          <p style={helperText}>
            Use password below, or request OTP for quick login with email or mobile number.
          </p>

          <label style={label}>Password</label>

          <div style={passwordBox}>
            <input
              style={passwordInput}
              placeholder="Enter password"
              type={showPassword ? "text" : "password"}
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              className="royal-hover"
              style={eyeBtn}
              data-enter-skip="true"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div style={forgotRow}>
            <span style={forgot} onClick={forgotPassword}>
              Send OTP instead
            </span>
          </div>

          <button
            className="royal-hover"
            style={mainBtn}
            onClick={login}
            disabled={busyAction !== ""}
          >
            {busyAction === "password" ? "Logging in..." : "Login with Password"}
          </button>

          <div style={otpDivider}>or</div>

          <button
            className="royal-hover"
            style={secondaryOtpBtn}
            onClick={requestOtp}
            disabled={busyAction !== ""}
          >
            {busyAction === "requestOtp" ? "Creating OTP..." : "Request OTP"}
          </button>

          {otpRequested && (
            <>
              <label style={{ ...label, marginTop: 20 }}>OTP</label>
              <input
                style={input}
                placeholder="Enter 6-digit OTP"
                value={otp}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                onChange={(e) => setOtp(e.target.value)}
              />

              {otpPreview && (
                <div style={otpPreviewCard}>
                  Demo OTP for testing: <b>{otpPreview}</b>
                </div>
              )}

              <button
                className="royal-hover"
                style={otpBtn}
                onClick={loginWithOtp}
                disabled={busyAction !== ""}
              >
                {busyAction === "otp" ? "Verifying OTP..." : "Login with OTP"}
              </button>
            </>
          )}

          {message && <p style={error}>{message}</p>}

          <p style={bottomText}>
            Don&apos;t have an account?{" "}
            <span style={link} onClick={() => router.push("/register")}>
              Register
            </span>
          </p>
        </section>
      </section>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  background:
    "radial-gradient(circle at top left, rgba(255,255,255,0.98) 0%, rgba(255,248,220,0.94) 28%, rgba(245,224,148,0.84) 64%, rgba(214,188,95,0.80) 100%)",
  padding: "20px",
};

const shell: React.CSSProperties = {
  width: "min(1200px,100%)",
  display: "grid",
  gap: 20,
  alignItems: "stretch",
  background: "rgba(255,255,255,0.48)",
  borderRadius: 32,
  boxShadow: "0 32px 80px rgba(91,64,0,0.16)",
  border: "1px solid rgba(184,134,11,0.18)",
};

const infoPanel: React.CSSProperties = {
  borderRadius: 28,
  background:
    "linear-gradient(165deg,rgba(27,35,51,0.97),rgba(64,47,12,0.90) 52%,rgba(212,175,55,0.84) 100%)",
  color: "#fffdf8",
  display: "grid",
  alignContent: "start",
  gap: 18,
};

const backLink: React.CSSProperties = {
  width: "fit-content",
  color: "rgba(255,255,255,0.86)",
  textDecoration: "none",
  fontWeight: 800,
};

const brandRow: React.CSSProperties = {
  display: "grid",
  gap: 18,
};

const logoWrap: React.CSSProperties = {
  width: 124,
  height: 124,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.92)",
  display: "grid",
  placeItems: "center",
  boxShadow: "0 18px 36px rgba(0,0,0,0.22)",
};

const logo: React.CSSProperties = {
  borderRadius: "50%",
  objectFit: "cover",
};

const brandEyebrow: React.CSSProperties = {
  color: "#f5df95",
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: 0.8,
  fontWeight: 900,
};

const brandTitle: React.CSSProperties = {
  margin: "10px 0 0",
  color: "white",
  lineHeight: 1.02,
  fontWeight: 950,
};

const brandText: React.CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.82)",
  fontSize: 17,
  lineHeight: 1.75,
  fontWeight: 700,
};

const pointGrid: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const pointCard: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: 18,
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.12)",
  fontWeight: 800,
  lineHeight: 1.55,
};

const card: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: "28px",
  boxShadow: "0 25px 60px rgba(0,0,0,0.18)",
};

const title: React.CSSProperties = {
  textAlign: "center",
  fontWeight: 900,
  margin: 0,
  color: "#111827",
};

const subtitle: React.CSSProperties = {
  textAlign: "center",
  color: "#64748b",
  fontSize: "19px",
  marginTop: "8px",
  marginBottom: "30px",
};

const helperText: React.CSSProperties = {
  marginTop: "-6px",
  marginBottom: "18px",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.6,
  fontWeight: 700,
};

const label: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontWeight: 800,
  fontSize: "16px",
  color: "#111827",
};

const input: React.CSSProperties = {
  width: "100%",
  height: "58px",
  borderRadius: "14px",
  border: "1.5px solid #cbd5e1",
  padding: "0 18px",
  fontSize: "17px",
  marginBottom: "18px",
  outline: "none",
  background: "#f8fafc",
};

const passwordBox: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  border: "1.5px solid #cbd5e1",
  borderRadius: "14px",
  height: "58px",
  overflow: "hidden",
  background: "#f8fafc",
};

const passwordInput: React.CSSProperties = {
  flex: 1,
  border: "none",
  padding: "0 18px",
  fontSize: "17px",
  outline: "none",
  background: "transparent",
};

const eyeBtn: React.CSSProperties = {
  border: "none",
  background: "#e2e8f0",
  height: "100%",
  padding: "0 20px",
  fontWeight: 800,
  cursor: "pointer",
  fontSize: "15px",
};

const forgotRow: React.CSSProperties = {
  textAlign: "right",
  marginTop: "12px",
  marginBottom: "22px",
};

const forgot: React.CSSProperties = {
  color: "#2563eb",
  fontWeight: 800,
  cursor: "pointer",
};

const mainBtn: React.CSSProperties = {
  width: "100%",
  height: "60px",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(135deg,#16a34a,#22c55e)",
  color: "white",
  fontSize: "20px",
  fontWeight: 900,
  cursor: "pointer",
};

const otpDivider: React.CSSProperties = {
  margin: "18px 0 14px",
  textAlign: "center",
  color: "#94a3b8",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0.8,
  fontSize: "12px",
};

const secondaryOtpBtn: React.CSSProperties = {
  width: "100%",
  height: "56px",
  borderRadius: "14px",
  border: "1.5px solid rgba(180,83,9,0.45)",
  background: "#fff7ed",
  color: "#b45309",
  fontSize: "18px",
  fontWeight: 900,
  cursor: "pointer",
};

const otpPreviewCard: React.CSSProperties = {
  marginTop: "-2px",
  marginBottom: "16px",
  padding: "12px 14px",
  borderRadius: "14px",
  background: "#fef3c7",
  color: "#854d0e",
  fontWeight: 800,
  lineHeight: 1.6,
};

const otpBtn: React.CSSProperties = {
  ...mainBtn,
  background: "linear-gradient(135deg,#2563eb,#3b82f6)",
};

const error: React.CSSProperties = {
  color: "#dc2626",
  textAlign: "center",
  marginTop: "18px",
  fontWeight: 700,
};

const bottomText: React.CSSProperties = {
  textAlign: "center",
  marginTop: "28px",
  color: "#334155",
  fontSize: "16px",
};

const link: React.CSSProperties = {
  color: "#b45309",
  fontWeight: 900,
  cursor: "pointer",
};
