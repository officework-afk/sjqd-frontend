"use client";

import AppShell from "../components/AppShell";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { handleEnterAdvance } from "../components/useEnterAdvance";
import { API_BASE_URL } from "../lib/api";

const API = API_BASE_URL;

export default function ProfilePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    companyName: "",
    proprietorName: "",
    gstNumber: "",
    businessType: "",
    phone: "",
    email: "",
    address: "",
    logo: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const loadProfile = async () => {
    const saved = localStorage.getItem("companyProfile");
    if (saved) {
      setForm((prev) => ({ ...prev, ...JSON.parse(saved) }));
    }

    try {
      const res = await fetch(`${API}/company`);
      const data = await res.json();

      if (data) {
        const nextForm = {
          companyName: data.companyName ?? "",
          proprietorName: data.proprietorName ?? "",
          gstNumber: data.gstNumber ?? "",
          businessType: data.businessType ?? "",
          phone: data.phone ?? "",
          email: data.email ?? "",
          address: data.address ?? "",
          logo: data.logo ?? "",
        };

        setForm((prev) => ({
          ...prev,
          ...nextForm,
        }));
        localStorage.setItem("companyProfile", JSON.stringify(nextForm));
      }
    } catch {}
  };

  const saveProfile = async () => {
    localStorage.setItem("companyProfile", JSON.stringify(form));

    try {
      const res = await fetch(`${API}/company`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        alert("Profile saved locally. Backend save failed.");
        return;
      }

      alert("Company profile saved successfully");
    } catch {
      alert("Profile saved locally");
    }
  };

  const handleLogoUpload = (file?: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 400;

        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);

        update("logo", canvas.toDataURL("image/jpeg", 0.75));
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  };

  return (
    <AppShell>
      <main style={page}>
        <section style={card}>
          <div style={goldGlow} />
          <div style={blueGlow} />

          <div style={header}>
            <div>
              <p style={eyebrow}>BUSINESS BRANDING PROFILE</p>
              <h1 style={title}>Company Profile</h1>
              <p style={subTitle}>
                Maintain business identity, contact details, logo branding and invoice print information.
              </p>
            </div>

            <button style={dashboardBtn} onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </button>
          </div>

          <div style={contentGrid}>
            <div style={logoPanel}>
              <div style={logoRingOuter}>
                <div style={logoBox}>
                  {form.logo ? (
                    <img src={form.logo} alt="Company Logo" style={logoImg} />
                  ) : (
                    <span style={logoText}>{(form.companyName || "S").slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
              </div>

              <h2 style={brandName}>{form.companyName || "Company Name"}</h2>
              <p style={brandSub}>Premium business identity for dashboard, invoices and reports.</p>

              <label style={uploadBtn}>
                Upload Company Logo
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                />
              </label>

              <button style={removeBtn} onClick={() => update("logo", "")} type="button">
                Remove Logo
              </button>

              <div style={hintBox}>
                <b>Logo Usage</b>
                <span>Dashboard Sidebar</span>
                <span>Invoice Print / PDF</span>
                <span>Business Reports</span>
              </div>
            </div>

            <div style={formPanel} onKeyDown={handleEnterAdvance}>
              <div style={panelHeader}>
                <div>
                  <h2 style={sectionTitle}>Business Details</h2>
                  <p style={sectionSub}>These details will be used throughout the software.</p>
                </div>
              </div>

              <div style={formGrid}>
                <Field label="Company Name" value={form.companyName} onChange={(v: string) => update("companyName", v)} />
                <Field label="Proprietor Name" value={form.proprietorName} onChange={(v: string) => update("proprietorName", v)} />
                <Field label="GST Number" value={form.gstNumber} onChange={(v: string) => update("gstNumber", v.toUpperCase())} />
                <Field label="Business Type" value={form.businessType} onChange={(v: string) => update("businessType", v)} />
                <Field label="Phone Number" value={form.phone} onChange={(v: string) => update("phone", v)} />
                <Field label="Email" value={form.email} onChange={(v: string) => update("email", v)} />

                <label style={{ ...fieldWrap, gridColumn: "span 2" }}>
                  <span style={labelStyle}>Business Address</span>
                  <textarea
                    style={textarea}
                    value={form.address ?? ""}
                    onChange={(e) => update("address", e.target.value)}
                    placeholder="Enter complete business address"
                  />
                </label>
              </div>

              <button style={saveBtn} onClick={saveProfile}>
                Save Company Profile
              </button>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function Field({ label, value, onChange }: any) {
  return (
    <label style={fieldWrap}>
      <span style={labelStyle}>{label}</span>
      <input
        style={input}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
      />
    </label>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  padding: "22px 26px",
  color: "#2f2300",
  background:
    "radial-gradient(circle at top left,rgba(255,255,255,0.98) 0,rgba(255,250,222,0.94) 28%,rgba(240,224,133,0.88) 62%,rgba(197,167,55,0.82) 100%)",
};

const card: React.CSSProperties = {
  position: "relative",
  width: "100%",
  minHeight: "calc(100vh - 44px)",
  margin: 0,
  borderRadius: "34px",
  padding: "34px",
  background:
    "linear-gradient(145deg,rgba(255,255,248,0.96),rgba(255,247,210,0.92))",
  border: "1px solid rgba(184,134,11,0.30)",
  boxShadow:
    "0 30px 70px rgba(91,64,0,0.20), inset 0 1px 0 rgba(255,255,255,0.90)",
  overflow: "hidden",
};

const goldGlow: React.CSSProperties = {
  position: "absolute",
  top: -170,
  right: -120,
  width: 480,
  height: 480,
  background: "radial-gradient(circle,rgba(250,204,21,0.34),transparent 68%)",
  pointerEvents: "none",
};

const blueGlow: React.CSSProperties = {
  position: "absolute",
  bottom: -160,
  left: "35%",
  width: 520,
  height: 360,
  background: "radial-gradient(circle,rgba(59,130,246,0.10),transparent 70%)",
  pointerEvents: "none",
};

const header: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "24px",
  marginBottom: "30px",
};

const eyebrow: React.CSSProperties = {
  margin: "0 0 8px",
  color: "#9a6a00",
  fontSize: "13px",
  fontWeight: 950,
  letterSpacing: 2,
};

const title: React.CSSProperties = {
  margin: 0,
  fontSize: "48px",
  fontWeight: 950,
  letterSpacing: 0.5,
  color: "#1f2937",
};

const subTitle: React.CSSProperties = {
  margin: "12px 0 0",
  color: "#5f552e",
  fontSize: "16px",
  maxWidth: 760,
  lineHeight: 1.6,
  fontWeight: 700,
};

const dashboardBtn: React.CSSProperties = {
  border: "1px solid rgba(184,134,11,0.22)",
  borderRadius: "16px",
  background: "linear-gradient(135deg,#ffffff,#fff2b8)",
  color: "#3f2a00",
  padding: "15px 24px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 12px 26px rgba(91,64,0,0.14)",
};

const contentGrid: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gridTemplateColumns: "380px 1fr",
  alignItems: "stretch",
  minHeight: "72vh",
  gap: "30px",
};

const logoPanel: React.CSSProperties = {
  background:
    "linear-gradient(160deg,rgba(255,255,255,0.92),rgba(255,248,220,0.86))",
  border: "1px solid rgba(184,134,11,0.24)",
  borderRadius: "30px",
  padding: "30px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  boxShadow: "0 20px 45px rgba(91,64,0,0.12), inset 0 1px 0 rgba(255,255,255,0.90)",
};

const logoRingOuter: React.CSSProperties = {
  width: 220,
  height: 220,
  borderRadius: "50%",
  padding: 7,
  background: "linear-gradient(135deg,#8b5a00,#d4af37,#fff2a8,#b8860b)",
  boxShadow: "0 25px 50px rgba(184,134,11,0.24)",
};

const logoBox: React.CSSProperties = {
  width: "100%",
  height: "100%",
  borderRadius: "50%",
  background: "radial-gradient(circle,#fffefa,#fff1a8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  border: "5px solid rgba(255,255,255,0.98)",
};

const logoImg: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const logoText: React.CSSProperties = {
  color: "#7a5200",
  fontSize: "68px",
  fontWeight: 950,
  textShadow: "0 3px 0 rgba(255,255,255,0.75)",
};

const brandName: React.CSSProperties = {
  margin: "24px 0 6px",
  textAlign: "center",
  fontSize: "26px",
  fontWeight: 950,
  letterSpacing: 1,
  color: "#3f2a00",
};

const brandSub: React.CSSProperties = {
  margin: "0 0 24px",
  textAlign: "center",
  color: "#5f552e",
  lineHeight: 1.6,
  fontWeight: 800,
};

const uploadBtn: React.CSSProperties = {
  width: "100%",
  textAlign: "center",
  background: "linear-gradient(135deg,#8b5a00,#d4af37,#facc15)",
  color: "#fffdf2",
  padding: "16px",
  borderRadius: "16px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 14px 30px rgba(184,134,11,0.26)",
};

const removeBtn: React.CSSProperties = {
  width: "100%",
  marginTop: "12px",
  background: "linear-gradient(135deg,#ef4444,#b91c1c)",
  color: "white",
  border: "none",
  padding: "15px",
  borderRadius: "16px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(185,28,28,0.16)",
};

const hintBox: React.CSSProperties = {
  width: "100%",
  marginTop: "22px",
  background: "linear-gradient(145deg,#ffffff,#fff7dc)",
  border: "1px solid rgba(184,134,11,0.20)",
  borderRadius: "18px",
  padding: "18px",
  color: "#3f2a00",
  lineHeight: 1.8,
  textAlign: "center",
  display: "grid",
  gap: 4,
  fontWeight: 800,
};

const formPanel: React.CSSProperties = {
  background:
    "linear-gradient(160deg,rgba(255,255,255,0.92),rgba(255,249,226,0.86))",
  border: "1px solid rgba(184,134,11,0.24)",
  borderRadius: "30px",
  padding: "30px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  boxShadow: "0 20px 45px rgba(91,64,0,0.12), inset 0 1px 0 rgba(255,255,255,0.90)",
};

const panelHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 18,
  marginBottom: 24,
};

const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: "30px",
  fontWeight: 950,
  color: "#3f2a00",
};

const sectionSub: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#6f5b1f",
  fontWeight: 800,
};

const formGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
};

const fieldWrap: React.CSSProperties = {
  display: "grid",
  gap: "9px",
};

const labelStyle: React.CSSProperties = {
  color: "#5d4100",
  fontSize: "14px",
  fontWeight: 950,
};

const input: React.CSSProperties = {
  width: "100%",
  height: "58px",
  borderRadius: "16px",
  border: "1px solid rgba(184,134,11,0.22)",
  background: "linear-gradient(145deg,#ffffff,#fffdf1)",
  color: "#1f2937",
  padding: "0 18px",
  fontSize: "15px",
  fontWeight: 850,
  outline: "none",
  boxSizing: "border-box",
  boxShadow: "inset 0 2px 8px rgba(91,64,0,0.06)",
};

const textarea: React.CSSProperties = {
  ...input,
  height: "130px",
  paddingTop: "16px",
  resize: "vertical",
};

const saveBtn: React.CSSProperties = {
  width: "100%",
  marginTop: "30px",
  border: "none",
  borderRadius: "18px",
  background: "linear-gradient(135deg,#15803d,#22c55e,#86efac)",
  color: "white",
  padding: "20px",
  fontSize: "18px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 18px 38px rgba(34,197,94,0.22)",
};
