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
  const [resetPassword, setResetPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [otpPreview, setOtpPreview] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [showOtpPanel, setShowOtpPanel] = useState(false);
  const [otpMode, setOtpMode] = useState<"login" | "reset">("login");
  const [busyAction, setBusyAction] = useState<"" | "password" | "requestOtp" | "otp" | "reset">("");

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
    setResetPassword("");
    setShowResetPassword(false);
    setOtpPreview("");
    setOtpRequested(false);
    setShowOtpPanel(false);
    setOtpMode("login");
    setMessage("");
  };

  const finishLogin = (data: any) => {
    localStorage.setItem("user", JSON.stringify(data.user || {}));
    localStorage.setItem("token", data.token || "");
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

  const requestOtp = async (mode: "login" | "reset" = otpMode) => {
    setMessage("");
    setOtpMode(mode);
    setShowOtpPanel(true);

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
    setOtpMode("reset");
    setShowOtpPanel(true);
    setOtpRequested(false);
    setOtp("");
    setResetPassword("");
    setShowResetPassword(false);
    setOtpPreview("");
    setMessage("Forgot password? Request an OTP and set a new password. SMS or email delivery must be connected for live OTP.");
  };

  const toggleOtpPanel = () => {
    setOtpMode("login");
    setOtpRequested(false);
    setOtp("");
    setResetPassword("");
    setShowResetPassword(false);
    setOtpPreview("");
    setMessage("");
    setShowOtpPanel((prev) => (showOtpPanel && otpMode === "login" ? !prev : true));
  };

  const resetPasswordWithOtp = async () => {
    setMessage("");

    if (!identifier || !otp || !resetPassword) {
      setMessage("Email/mobile number, OTP and new password are required");
      return;
    }

    try {
      setBusyAction("reset");
      const res = await fetch(`${API}/auth/reset-password-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp, newPassword: resetPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Password reset failed");
        return;
      }

      setPassword("");
      setOtp("");
      setResetPassword("");
      setShowResetPassword(false);
      setOtpPreview("");
      setOtpRequested(false);
      setOtpMode("login");
      setShowOtpPanel(false);
      setMessage(data.message || "Password reset successful. Login with your new password.");
    } catch {
      setMessage("Server error. Please check backend is running.");
    } finally {
      setBusyAction("");
    }
  };

  const messageStyle: React.CSSProperties = /otp created|successful|success/i.test(message)
    ? successMessage
    : /connect email\/sms|forgot password|request otp|set a new password/i.test(message)
    ? infoMessage
    : error;

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
          <p style={subtitle}>Password login first, OTP only when you really need it</p>

          <label style={label}>Email or Mobile Number</label>
          <input
            style={input}
            placeholder="Enter email or mobile number"
            value={identifier}
            autoComplete="username"
            onChange={(e) => handleIdentifierChange(e.target.value)}
          />

          <p style={helperText}>
            Keep the daily login simple with password. OTP remains available as a secondary option.
          </p>
          <p style={helperTextSecondary}>
            Use the exact email or mobile number saved during registration. If that account was created with mobile only, email login will not work until an email is added to that account.
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
            <button type="button" style={linkButton} onClick={forgotPassword}>
              Forgot password?
            </button>
            <button type="button" style={linkButton} onClick={toggleOtpPanel}>
              {showOtpPanel ? "Hide OTP login" : "Use OTP login"}
            </button>
          </div>

          <button
            className="royal-hover"
            style={mainBtn}
            onClick={login}
            disabled={busyAction !== ""}
          >
            {busyAction === "password" ? "Logging in..." : "Login with Password"}
          </button>

          {showOtpPanel && (
            <div style={otpPanel}>
              <div style={otpPanelHeader}>
                <div>
                  <div style={otpPanelTitle}>
                    {otpMode === "reset" ? "Reset password with OTP" : "OTP Login"}
                  </div>
                  <p style={otpPanelText}>
                    {otpMode === "reset"
                      ? "Request a reset OTP, then choose a new password. SMS or email delivery must be connected for live OTP."
                      : "Use this only when password login is not available. SMS or email delivery must be connected for live OTP."}
                  </p>
                </div>
              </div>

              <button
                className="royal-hover"
                style={secondaryOtpBtn}
                onClick={() => requestOtp(otpMode)}
                disabled={busyAction !== ""}
              >
                {busyAction === "requestOtp"
                  ? "Creating OTP..."
                  : otpMode === "reset"
                  ? "Send Reset OTP"
                  : "Send Login OTP"}
              </button>

              {otpRequested && (
                <>
                  <label style={{ ...label, marginTop: 18 }}>OTP</label>
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

                  {otpMode === "reset" ? (
                    <>
                      <label style={{ ...label, marginTop: 16 }}>New Password</label>
                      <div style={passwordBox}>
                        <input
                          style={passwordInput}
                          placeholder="Enter new password"
                          type={showResetPassword ? "text" : "password"}
                          value={resetPassword}
                          autoComplete="new-password"
                          onChange={(e) => setResetPassword(e.target.value)}
                        />

                        <button
                          type="button"
                          className="royal-hover"
                          style={eyeBtn}
                          data-enter-skip="true"
                          onClick={() => setShowResetPassword((prev) => !prev)}
                        >
                          {showResetPassword ? "Hide" : "Show"}
                        </button>
                      </div>

                      <button
                        className="royal-hover"
                        style={otpBtn}
                        onClick={resetPasswordWithOtp}
                        disabled={busyAction !== ""}
                      >
                        {busyAction === "reset" ? "Resetting password..." : "Reset Password"}
                      </button>
                    </>
                  ) : (
                    <button
                      className="royal-hover"
                      style={otpBtn}
                      onClick={loginWithOtp}
                      disabled={busyAction !== ""}
                    >
                      {busyAction === "otp" ? "Verifying OTP..." : "Login with OTP"}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {message && <p style={messageStyle}>{message}</p>}

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
  marginBottom: "8px",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.6,
  fontWeight: 700,
};

const helperTextSecondary: React.CSSProperties = {
  marginTop: 0,
  marginBottom: "18px",
  color: "#7c3aed",
  fontSize: "13px",
  lineHeight: 1.55,
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
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginTop: "12px",
  marginBottom: "22px",
};

const linkButton: React.CSSProperties = {
  border: "none",
  background: "transparent",
  padding: 0,
  color: "#2563eb",
  fontWeight: 800,
  cursor: "pointer",
  fontSize: "15px",
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

const otpPanel: React.CSSProperties = {
  marginTop: "6px",
  padding: "18px",
  borderRadius: "18px",
  border: "1px solid rgba(180,83,9,0.22)",
  background: "linear-gradient(180deg,#fffaf0,#fff7ed)",
};

const otpPanelHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: "14px",
};

const otpPanelTitle: React.CSSProperties = {
  color: "#7c2d12",
  fontWeight: 900,
  fontSize: "18px",
};

const otpPanelText: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#9a3412",
  fontSize: "13px",
  lineHeight: 1.6,
  fontWeight: 700,
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

const infoMessage: React.CSSProperties = {
  ...error,
  color: "#b45309",
};

const successMessage: React.CSSProperties = {
  ...error,
  color: "#15803d",
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
