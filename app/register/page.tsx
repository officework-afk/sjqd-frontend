"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useResponsive } from "../components/useResponsive";
import { handleEnterAdvance } from "../components/useEnterAdvance";
import { API_BASE_URL } from "../lib/api";

const API = API_BASE_URL;

const benefits = [
  "Create your account and start billing quickly",
  "Maintain party, stock and GST data in one place",
  "Use on mobile, Mac, laptop and desktop browser",
  "Professional screens for day-to-day business use",
];

export default function RegisterPage() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        router.push("/");
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [router]);

  const register = async () => {
    setMessage("");

    if (!name || !password || (!email && !phone)) {
      setMessage("Name, password and at least one email or mobile number are required");
      return;
    }

    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Registration failed");
        return;
      }

      alert("Account created successfully. You can login with password or OTP.");
      router.push("/login");
    } catch {
      setMessage("Server error. Please check backend is running.");
    }
  };

  return (
    <main style={page}>
      <section
        style={{
          ...shell,
          gridTemplateColumns: isTablet ? "1fr" : "minmax(340px,0.88fr) minmax(360px,0.8fr)",
          padding: isMobile ? 18 : 24,
        }}
      >
        <aside style={{ ...infoPanel, padding: isMobile ? 24 : 34 }}>
          <Link href="/" style={backLink}>
            Back to Home
          </Link>

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

          <div style={brandEyebrow}>Create access to SJQD Software</div>
          <h1 style={{ ...brandTitle, fontSize: isMobile ? 38 : 52 }}>
            Start with a business-ready billing workspace
          </h1>

          <p style={brandText}>
            Register once and use SJQD Software for billing, item tracking, GST,
            accounts and business reporting across different devices.
          </p>

          <div style={pointGrid}>
            {benefits.map((item) => (
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
          <h2 style={{ ...title, fontSize: isMobile ? 38 : 48 }}>Create Account</h2>
          <p style={subtitle}>Register with email ID and mobile number for password or OTP login</p>

          <label style={label}>Full Name</label>
          <input
            style={input}
            placeholder="Enter full name"
            value={name}
            autoComplete="name"
            onChange={(e) => setName(e.target.value)}
          />

          <label style={label}>Email ID</label>
          <input
            style={input}
            placeholder="Enter email ID (optional)"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <label style={label}>Mobile Number</label>
          <input
            style={input}
            placeholder="Enter mobile number"
            value={phone}
            inputMode="tel"
            autoComplete="tel"
            onChange={(e) => setPhone(e.target.value)}
          />

          <p style={helperText}>
            Mobile number lets your clients login with OTP. Email ID can also be used for OTP login.
          </p>

          <label style={label}>Password</label>
          <div style={passwordBox}>
            <input
              style={passwordInput}
              placeholder="Enter password"
              type={showPassword ? "text" : "password"}
              value={password}
              autoComplete="new-password"
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

          <button className="royal-hover" style={mainBtn} onClick={register}>
            Register
          </button>

          {message && <p style={error}>{message}</p>}

          <p style={bottomText}>
            Already have an account?{" "}
            <span style={link} onClick={() => router.push("/login")}>
              Login
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
    "linear-gradient(165deg,rgba(31,41,55,0.96),rgba(87,61,9,0.88) 54%,rgba(212,175,55,0.82) 100%)",
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
  margin: 0,
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
  background: "white",
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
  marginBottom: "20px",
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
  marginBottom: "22px",
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

const mainBtn: React.CSSProperties = {
  width: "100%",
  height: "60px",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(135deg,#d97706,#f59e0b)",
  color: "white",
  fontSize: "20px",
  fontWeight: 900,
  cursor: "pointer",
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
