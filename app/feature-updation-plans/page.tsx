"use client";

import AppShell from "../components/AppShell";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  paleButton,
  positiveHeading,
  positiveMuted,
  positivePage,
  positivePanel,
  positiveTableHead,
  positiveText,
} from "../components/positiveTheme";

type FeaturePlan = {
  title: string;
  status: "Coming Soon" | "In Progress" | "Planned";
  details: string;
};

type FeedbackRow = {
  id: string;
  clientName: string;
  mobile: string;
  businessName: string;
  request: string;
  dateTime: string;
};

const FEEDBACK_KEY = "featureFeedbackRequests";

const plans: FeaturePlan[] = [

{
  title: "Language Option",
  status: "Coming Soon",
  details:
    "Clients can choose their preferred language for software usage. Support planned for English, Hindi, Kannada, Tamil, Telugu, and other regional languages for easier billing and navigation.",
},
    {
    title: "Universal AI Bill Extraction",
    status: "Coming Soon",
    details:
      "Upload or capture invoice images/PDFs and auto-fill sales, purchase, and return forms after review.",
  },
    {
    title: "Voice Billing Assistant",
    status: "In Progress",
    details:
      "Clients can create invoices using voice commands instead of typing. They can speak customer name, item name, quantity, rate, GST, mobile number, and other details. Voice typing support will be available across invoice entry forms and other text fields.",
  },
    {
  title: "Invoice Print Customization",
  status: "Planned",
  details:
    "Clients will be able to customize invoice print layouts as per business requirements, including logo placement, header style, item table format, tax summary, terms, signature, bank details, and professional print design options.",
},
  {
    title: "Client Business Dashboard",
    status: "Planned",
    details:
      "Client-facing dashboard for invoice summary, GST status, outstanding balance, stock alerts, and reports.",
  },
];

export default function FeatureUpdationPlansPage() {
  const router = useRouter();

  const [feedbackList, setFeedbackList] = useState<FeedbackRow[]>([]);
  const [request, setRequest] = useState("");
  const [hoveredPlan, setHoveredPlan] = useState<string>("");

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "[]");
      setFeedbackList(Array.isArray(saved) ? saved : []);
    } catch {
      setFeedbackList([]);
    }
  };

  const getClientProfile = () => {
    try {
      const profile = JSON.parse(localStorage.getItem("companyProfile") || "{}");
      return {
        clientName:
          profile.clientName ||
          profile.ownerName ||
          profile.proprietorName ||
          profile.name ||
          profile.companyName ||
          "Client",
        mobile:
          profile.mobile ||
          profile.phone ||
          profile.contactNo ||
          profile.phoneNumber ||
          "-",
        businessName:
          profile.companyName ||
          profile.businessName ||
          profile.tradeName ||
          profile.firmName ||
          "-",
      };
    } catch {
      return {
        clientName: "Client",
        mobile: "-",
        businessName: "-",
      };
    }
  };

  const saveFeedback = () => {
    if (!request.trim()) {
      alert("Please mention the feature or update required by the client.");
      return;
    }

    const profile = getClientProfile();

    const row: FeedbackRow = {
      id: `${Date.now()}`,
      clientName: profile.clientName,
      mobile: profile.mobile,
      businessName: profile.businessName,
      request: request.trim(),
      dateTime: new Date().toLocaleString("en-IN"),
    };

    const updated = [row, ...feedbackList];
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(updated));
    setFeedbackList(updated);
    setRequest("");
    alert("Feedback saved successfully.");
  };

  const deleteFeedback = (id: string) => {
    const updated = feedbackList.filter((x) => x.id !== id);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(updated));
    setFeedbackList(updated);
  };

  return (
    <AppShell>
      <main style={page}>
        <section style={hero}>
          <div>
            <h1 style={heroTitle}>FEATURE UPDATION PLANS</h1>
            <p style={heroSub}>Upcoming software features for your clients</p>
          </div>
          <button style={backBtn} onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </button>
        </section>

        <section style={grid}>
          {plans.map((plan) => {
            const isHover = hoveredPlan === plan.title;
            return (
              <div
                key={plan.title}
                style={{
                  ...card,
                  ...(isHover ? royalCardHover : {}),
                }}
                onMouseEnter={() => setHoveredPlan(plan.title)}
                onMouseLeave={() => setHoveredPlan("")}
              >
                {isHover && <div style={royalGlowTop} />}

                <div style={cardHead}>
                  <h2 style={cardTitle}>{plan.title}</h2>
                  <span style={statusBadge(plan.status)}>{plan.status}</span>
                </div>

                <p style={details}>{plan.details}</p>
              </div>
            );
          })}
        </section>

        <section style={feedbackBox}>
          <div>
            <h2 style={sectionTitle}>Client Feedback / Feature Request</h2>
            <p style={sectionSub}>
              Client details will be taken automatically from their profile. They only need to mention the required feature, update, or problem.
            </p>
          </div>

          <div style={queryGrid}>
            <textarea
              style={textArea}
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder="Mention required feature / update / problem here..."
            />

            <button style={submitBtn} onClick={saveFeedback}>
              Submit Feedback
            </button>
          </div>
        </section>

        <section style={tableBox}>
          <div style={tableHead}>
            <h2 style={sectionTitle}>Feedback Received</h2>
            <span style={countBadge}>{feedbackList.length} Requests</span>
          </div>

          {feedbackList.length === 0 ? (
            <p style={emptyText}>No client feedback saved yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Date & Time</th>
                    <th style={th}>Client</th>
                    <th style={th}>Mobile</th>
                    <th style={th}>Business</th>
                    <th style={th}>Required Feature / Feedback</th>
                    <th style={th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbackList.map((f) => (
                    <tr key={f.id} style={tr}>
                      <td style={td}>{f.dateTime}</td>
                      <td style={td}>{f.clientName}</td>
                      <td style={td}>{f.mobile}</td>
                      <td style={td}>{f.businessName}</td>
                      <td style={td}>{f.request}</td>
                      <td style={td}>
                        <button style={deleteBtn} onClick={() => deleteFeedback(f.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section style={noteBox}>
          <h2 style={noteTitle}>Note for Clients</h2>
          <p style={noteText}>
            These features are under development and will be activated in future software updates.
          </p>
        </section>
      </main>
    </AppShell>
  );
}

const page: React.CSSProperties = {
  ...positivePage,
  minHeight: "100vh",
  padding: 24,
  color: positiveText,
};

const hero: React.CSSProperties = {
  background:
    "linear-gradient(135deg,rgba(255,255,255,0.88),rgba(255,239,174,0.78))",
  border: "1px solid rgba(255,255,255,0.9)",
  borderRadius: 22,
  padding: "38px 44px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  boxShadow: "0 16px 36px rgba(0,0,0,0.10)",
  marginBottom: 22,
};

const heroTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 38,
  fontWeight: 950,
  letterSpacing: 1,
};

const heroSub: React.CSSProperties = {
  marginTop: 12,
  fontWeight: 800,
};

const backBtn: React.CSSProperties = {
  ...paleButton,
  padding: "14px 22px",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(255px, 1fr))",
  gap: 18,
};

const card: React.CSSProperties = {
  minHeight: 210,
  background: "linear-gradient(145deg,#fffdf5,#f8f1d5)",
  border: "1px solid rgba(180,140,30,0.18)",
  borderRadius: 24,
  padding: 24,
  boxShadow: "0 10px 24px rgba(0,0,0,0.10)",
  transition: "all 0.35s ease",
  cursor: "pointer",
  position: "relative",
  overflow: "hidden",
};

const royalCardHover: React.CSSProperties = {
  background: "linear-gradient(145deg,#fffaf0,#fff1b8,#f7d774)",
  border: "2px solid #d4af37",
  transform: "translateY(-10px) scale(1.025)",
  boxShadow:
    "0 28px 60px rgba(120,83,13,0.26), 0 0 32px rgba(255,215,0,0.34), inset 0 1px 0 rgba(255,255,255,0.85)",
};

const royalGlowTop: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 6,
  background: "linear-gradient(90deg,#8b6508,#d4af37,#fff3b0,#d4af37,#8b6508)",
};

const cardHead: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  alignItems: "flex-start",
  position: "relative",
  zIndex: 2,
};

const cardTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 21,
  fontWeight: 950,
  lineHeight: 1.35,
};

const details: React.CSSProperties = {
  margin: "18px 0 0",
  lineHeight: 1.75,
  fontWeight: 750,
  color: "#5b470b",
  position: "relative",
  zIndex: 2,
};

const statusBadge = (status: FeaturePlan["status"]): React.CSSProperties => ({
  whiteSpace: "nowrap",
  borderRadius: 999,
  padding: "7px 12px",
  color: "white",
  fontWeight: 950,
  fontSize: 12,
  boxShadow: "0 6px 16px rgba(0,0,0,0.16)",
  background:
    status === "Coming Soon"
      ? "linear-gradient(135deg,#92400e,#d97706)"
      : status === "In Progress"
        ? "linear-gradient(135deg,#1d4ed8,#4f46e5)"
        : "linear-gradient(135deg,#334155,#64748b)",
});

const feedbackBox: React.CSSProperties = {
  marginTop: 22,
  background: "rgba(255,255,255,0.84)",
  border: "1px solid rgba(255,255,255,0.95)",
  borderRadius: 22,
  padding: 26,
  boxShadow: "0 16px 36px rgba(0,0,0,0.12)",
};

const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 950,
};

const sectionSub: React.CSSProperties = {
  margin: "10px 0 18px",
  fontWeight: 800,
  color: positiveMuted,
};

const queryGrid: React.CSSProperties = {
  display: "grid",
  gap: 14,
};

const textArea: React.CSSProperties = {
  width: "100%",
  minHeight: 125,
  borderRadius: 18,
  border: "2px solid rgba(180,140,30,0.28)",
  padding: 20,
  fontSize: 16,
  fontWeight: 750,
  background: "linear-gradient(145deg,rgba(255,255,255,0.96),rgba(255,248,220,0.94))",
  outline: "none",
  resize: "vertical",
  color: "#4a3400",
  boxShadow: "inset 0 2px 10px rgba(0,0,0,0.05)",
  boxSizing: "border-box",
};

const submitBtn: React.CSSProperties = {
  border: "none",
  borderRadius: 18,
  padding: "16px 30px",
  background: "linear-gradient(135deg,#8b6508,#d4af37,#facc15,#8b6508)",
  color: "white",
  fontWeight: 950,
  fontSize: 15,
  cursor: "pointer",
  width: 220,
  boxShadow: "0 14px 28px rgba(51, 3, 184, 0.34)",
};

const tableBox: React.CSSProperties = {
  marginTop: 22,
  ...positivePanel,
  color: positiveText,
  borderRadius: 22,
  padding: 26,
};

const tableHead: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
  marginBottom: 16,
};

const countBadge: React.CSSProperties = {
  background: "linear-gradient(135deg,#1d4ed8,#4f46e5)",
  color: "white",
  padding: "8px 13px",
  borderRadius: 999,
  fontWeight: 950,
};

const emptyText: React.CSSProperties = {
  color: "#cbd5e1",
  fontWeight: 800,
};

const table: React.CSSProperties = {
  width: "100%",
  minWidth: 900,
  borderCollapse: "collapse",
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: 13,
  ...positiveTableHead,
  fontWeight: 950,
};

const tr: React.CSSProperties = {
  borderBottom: "1px solid rgba(184,134,11,0.16)",
};

const td: React.CSSProperties = {
  padding: 13,
  fontWeight: 750,
  verticalAlign: "top",
};

const deleteBtn: React.CSSProperties = {
  border: "none",
  borderRadius: 10,
  padding: "9px 12px",
  background: "#dc2626",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const noteBox: React.CSSProperties = {
  marginTop: 22,
  ...positivePanel,
  color: positiveText,
  borderRadius: 22,
  padding: 26,
};

const noteTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 950,
};

const noteText: React.CSSProperties = {
  margin: "12px 0 0",
  color: positiveMuted,
  fontWeight: 800,
};
