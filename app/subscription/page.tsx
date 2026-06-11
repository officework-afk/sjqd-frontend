"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, type CSSProperties } from "react";
import AppShell from "../components/AppShell";
import {
  goldButton,
  paleButton,
  positiveHeading,
  positiveHeroCard,
  positiveMuted,
  positivePage,
  positivePanel,
  positiveText,
  successButton,
} from "../components/positiveTheme";
import { useResponsive } from "../components/useResponsive";

type Plan = {
  id: "demo" | "business" | "premium";
  name: string;
  price: string;
  billed: string;
  tag: string;
  color: string;
  accent: string;
  description: string;
  bestFor: string;
  features: string[];
  locked: string[];
  cta: string;
};

const plans: Plan[] = [
  {
    id: "demo",
    name: "Demo",
    price: "Free",
    billed: "for 30 days",
    tag: "Try First",
    color: "#d97706",
    accent: "linear-gradient(135deg,#d97706,#f59e0b)",
    description: "Test SJQD Software with live billing work before moving to a paid plan.",
    bestFor: "Trying billing, stock and GST flow with real day-to-day work",
    features: [
      "Sales Billing",
      "Purchase Entry",
      "Item Master",
      "Buyer and Supplier Master",
      "Invoice Print",
      "Dashboard Access",
      "Stock Summary",
    ],
    locked: [
      "Barcode Billing",
      "Excel Import",
      "Receivable Due Tracking",
      "Payable Due Tracking",
      "AI Bill Extraction",
    ],
    cta: "Start 30-Day Demo",
  },
  {
    id: "business",
    name: "Business",
    price: "Rs 999",
    billed: "per month",
    tag: "Most Popular",
    color: "#16a34a",
    accent: "linear-gradient(135deg,#166534,#22c55e)",
    description: "The main business billing plan for stores that want stock, dues and speed.",
    bestFor: "Daily billing, pending tracking, barcode and import work",
    features: [
      "Everything in Demo",
      "Barcode Billing",
      "Sales Return",
      "Purchase Return",
      "Cash and Bank Tracking",
      "Receivable Due Date Tracking",
      "Payable Due Date Tracking",
      "Excel Import and Export",
      "All Invoice Report",
      "Priority Business Support",
    ],
    locked: ["AI Bill Extraction", "Advanced GST Insights", "Multi User Access"],
    cta: "Choose Business",
  },
  {
    id: "premium",
    name: "Premium",
    price: "Rs 1,499",
    billed: "per month",
    tag: "Full Suite",
    color: "#2563eb",
    accent: "linear-gradient(135deg,#1d4ed8,#4f46e5)",
    description: "For advanced billing teams, accountants and faster document processing.",
    bestFor: "High-volume GST work, automation and advanced reports",
    features: [
      "Everything in Business",
      "AI Bill Extraction",
      "Faster Purchase Bill Entry",
      "Advanced GST Reports",
      "Management Dashboard",
      "Backup and Restore",
      "Overdue Customer Reports",
      "Overdue Supplier Reports",
      "Multi User Ready",
      "Priority Premium Support",
    ],
    locked: [],
    cta: "Choose Premium",
  },
];

function SubscriptionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile, isTablet } = useResponsive();
  const openedFromLogin = searchParams.get("entry") === "login";

  const activatePlan = (plan: Plan) => {
    const now = new Date();
    const savedPlan = {
      id: plan.id,
      name: plan.name,
      selectedAt: now.toISOString(),
      status: plan.id === "demo" ? "demo-active" : "selected",
      demoEndsAt:
        plan.id === "demo"
          ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : "",
    };

    localStorage.setItem("sjqdSubscriptionPlan", JSON.stringify(savedPlan));
    router.push("/dashboard");
  };

  const skipForNow = () => {
    localStorage.setItem(
      "sjqdSubscriptionPlan",
      JSON.stringify({
        id: "skip-now",
        name: "Skip Now",
        selectedAt: new Date().toISOString(),
        status: "skipped",
      }),
    );
    router.push("/dashboard");
  };

  const pageStyle = {
    ...page,
    padding: isMobile ? 14 : isTablet ? 18 : 24,
  };

  const heroStyle = {
    ...hero,
    padding: isMobile ? 22 : 34,
  };

  const gridStyle = {
    ...planGrid,
    gridTemplateColumns: isMobile
      ? "1fr"
      : isTablet
        ? "repeat(2,minmax(0,1fr))"
        : "repeat(3,minmax(0,1fr))",
  };

  return (
    <AppShell>
      <main style={pageStyle}>
        <section style={heroStyle}>
          <p style={eyebrow}>Subscription Plans</p>
          <h1 style={{ ...heroTitle, fontSize: isMobile ? 34 : 44 }}>
            Choose the right plan for your billing software
          </h1>
          <p style={heroText}>
            Compare all three plans with amount, included features and advanced options.
            This helps your customer understand which SJQD package fits their shop size and
            work style.
          </p>

          <div style={heroStrip}>
            <span style={heroStripItem}>3 clear plans</span>
            <span style={heroStripItem}>Royal business design</span>
            <span style={heroStripItem}>Barcode, GST, dues and AI upgrades</span>
          </div>

          <div
            style={{
              ...heroActionRow,
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <button
              type="button"
              className="royal-hover"
              style={{ ...heroActionBtn, ...heroPrimaryAction }}
              onClick={() => activatePlan(plans[0])}
            >
              Start 30-Day Demo
            </button>

            <button
              type="button"
              className="royal-hover"
              style={{ ...heroActionBtn, ...heroSecondaryAction }}
              onClick={skipForNow}
            >
              Skip Now
            </button>
          </div>

          <div style={helperCard}>
            <div style={helperTitle}>
              {openedFromLogin ? "Opened right after login" : "Quick access option"}
            </div>
            <p style={helperText}>
              This subscription page now opens first after login. Users can start a 30-day
              demo, choose a plan, or skip for now and continue to the dashboard.
            </p>
          </div>
        </section>

        <section style={gridStyle}>
          {plans.map((plan) => {
            const featured = plan.id === "business";
            const actionStyle =
              plan.id === "business"
                ? primaryChooseBtn
                : plan.id === "demo"
                  ? demoChooseBtn
                  : secondaryChooseBtn;

            return (
              <article
                key={plan.id}
                style={{
                  ...planCard,
                  transform: featured && !isMobile ? "translateY(-10px)" : "none",
                  borderTop: `6px solid ${plan.color}`,
                  boxShadow: featured
                    ? "0 28px 60px rgba(22,163,74,0.18)"
                    : "0 24px 56px rgba(91,64,0,0.12)",
                }}
              >
                <div style={planHeader}>
                  <span style={{ ...tag, background: plan.accent }}>{plan.tag}</span>
                  {featured && <span style={featuredMark}>Recommended</span>}
                </div>

                <h2 style={planName}>{plan.name}</h2>
                <p style={planDescription}>{plan.description}</p>

                <div style={priceWrap}>
                  <span style={price}>{plan.price}</span>
                  <span style={priceSub}>{plan.billed}</span>
                </div>

                <div style={bestForBox}>
                  <div style={bestForLabel}>Best For</div>
                  <div style={bestForText}>{plan.bestFor}</div>
                </div>

                <button
                  type="button"
                  className="royal-hover"
                  style={{
                    ...chooseBtn,
                    ...actionStyle,
                  }}
                  onClick={() => activatePlan(plan)}
                >
                  {plan.cta}
                </button>

                <div style={featureTitle}>Included In This Plan</div>
                <ul style={featureList}>
                  {plan.features.map((feature) => (
                    <li key={feature} style={featureItem}>
                      <span style={checkMark}>+</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.locked.length > 0 && (
                  <>
                    <div style={featureTitle}>Upgrade To Get</div>
                    <ul style={featureList}>
                      {plan.locked.map((feature) => (
                        <li key={feature} style={lockedItem}>
                          <span style={crossMark}>x</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </article>
            );
          })}
        </section>

        <section style={compareCard}>
          <h2 style={compareTitle}>How To Sell These Plans</h2>
          <div style={compareGrid}>
            <div style={compareBlock}>
              <div style={compareLabel}>Demo</div>
              <p style={compareText}>
                Offer this when the customer wants to try SJQD Software first before
                choosing a monthly plan.
              </p>
            </div>
            <div style={compareBlock}>
              <div style={compareLabel}>Business</div>
              <p style={compareText}>
                Make this your main plan because it covers barcode, import, due date
                tracking and full shop work.
              </p>
            </div>
            <div style={compareBlock}>
              <div style={compareLabel}>Premium</div>
              <p style={compareText}>
                Position this for serious GST users, accountants and customers who want AI
                extraction and advanced reports.
              </p>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<SubscriptionPageFallback />}>
      <SubscriptionPageContent />
    </Suspense>
  );
}

function SubscriptionPageFallback() {
  return (
    <AppShell>
      <main style={{ ...page, padding: 24 }}>
        <section style={{ ...hero, padding: 34 }}>
          <p style={eyebrow}>Subscription Plans</p>
          <h1 style={heroTitle}>Loading subscription page...</h1>
          <p style={heroText}>
            Preparing the SJQD plan details for mobile and desktop access.
          </p>
        </section>
      </main>
    </AppShell>
  );
}

const page: CSSProperties = {
  ...positivePage,
  minHeight: "100vh",
  color: positiveText,
};

const hero: CSSProperties = {
  ...positiveHeroCard,
  borderRadius: 28,
  marginBottom: 24,
  padding: 34,
};

const eyebrow: CSSProperties = {
  margin: 0,
  color: "#b45309",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: 1,
};

const heroTitle: CSSProperties = {
  margin: "10px 0 0",
  fontSize: 44,
  fontWeight: 950,
  color: positiveHeading,
  lineHeight: 1.1,
};

const heroText: CSSProperties = {
  margin: "14px 0 0",
  maxWidth: 880,
  color: positiveMuted,
  fontWeight: 700,
  lineHeight: 1.7,
};

const heroStrip: CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 18,
};

const heroStripItem: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.82)",
  border: "1px solid rgba(184,134,11,0.16)",
  color: "#5b4300",
  fontWeight: 850,
};

const heroActionRow: CSSProperties = {
  display: "flex",
  gap: 14,
  marginTop: 20,
  alignItems: "center",
};

const heroActionBtn: CSSProperties = {
  minHeight: 54,
  padding: "0 24px",
  borderRadius: 14,
  border: "none",
  fontSize: 16,
  fontWeight: 950,
  cursor: "pointer",
};

const heroPrimaryAction: CSSProperties = {
  ...goldButton,
};

const heroSecondaryAction: CSSProperties = {
  ...paleButton,
};

const helperCard: CSSProperties = {
  marginTop: 18,
  borderRadius: 20,
  padding: "16px 18px",
  background: "rgba(255,255,255,0.78)",
  border: "1px solid rgba(184,134,11,0.18)",
};

const helperTitle: CSSProperties = {
  color: positiveHeading,
  fontWeight: 950,
  fontSize: 14,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const helperText: CSSProperties = {
  margin: "8px 0 0",
  color: positiveMuted,
  fontWeight: 700,
  lineHeight: 1.6,
};

const planGrid: CSSProperties = {
  display: "grid",
  gap: 22,
};

const planCard: CSSProperties = {
  ...positivePanel,
  borderRadius: 28,
  padding: 24,
  transition: "transform 0.2s ease",
};

const planHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 12,
};

const tag: CSSProperties = {
  color: "white",
  borderRadius: 999,
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 900,
};

const featuredMark: CSSProperties = {
  color: "#166534",
  fontWeight: 900,
  fontSize: 13,
};

const planName: CSSProperties = {
  margin: 0,
  fontSize: 34,
  fontWeight: 950,
  color: positiveHeading,
};

const planDescription: CSSProperties = {
  margin: "10px 0 0",
  color: positiveMuted,
  fontWeight: 700,
  lineHeight: 1.6,
  minHeight: 50,
};

const priceWrap: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 10,
  marginTop: 18,
};

const price: CSSProperties = {
  fontSize: 42,
  fontWeight: 950,
  color: positiveHeading,
};

const priceSub: CSSProperties = {
  color: positiveMuted,
  fontWeight: 800,
};

const bestForBox: CSSProperties = {
  borderRadius: 18,
  padding: "14px 16px",
  marginTop: 18,
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(184,134,11,0.16)",
};

const bestForLabel: CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  color: "#7c5a10",
  textTransform: "uppercase",
  letterSpacing: 1,
};

const bestForText: CSSProperties = {
  marginTop: 6,
  fontWeight: 800,
  lineHeight: 1.5,
};

const chooseBtn: CSSProperties = {
  width: "100%",
  height: 54,
  borderRadius: 14,
  border: "none",
  fontSize: 16,
  fontWeight: 950,
  cursor: "pointer",
  marginTop: 20,
};

const demoChooseBtn: CSSProperties = {
  ...goldButton,
};

const primaryChooseBtn: CSSProperties = {
  ...successButton,
};

const secondaryChooseBtn: CSSProperties = {
  ...paleButton,
};

const featureTitle: CSSProperties = {
  marginTop: 22,
  marginBottom: 10,
  fontSize: 14,
  fontWeight: 950,
  textTransform: "uppercase",
  color: positiveHeading,
  letterSpacing: 0.5,
};

const featureList: CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "grid",
  gap: 10,
};

const featureItem: CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "flex-start",
  fontWeight: 750,
  lineHeight: 1.45,
};

const lockedItem: CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "flex-start",
  color: "#7f1d1d",
  fontWeight: 750,
  lineHeight: 1.45,
};

const checkMark: CSSProperties = {
  color: "#16a34a",
  fontWeight: 950,
};

const crossMark: CSSProperties = {
  color: "#ef4444",
  fontWeight: 950,
};

const compareCard: CSSProperties = {
  ...positivePanel,
  borderRadius: 28,
  padding: 26,
  marginTop: 24,
};

const compareTitle: CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 950,
  color: positiveHeading,
};

const compareGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 16,
  marginTop: 18,
};

const compareBlock: CSSProperties = {
  borderRadius: 20,
  padding: 18,
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(184,134,11,0.16)",
};

const compareLabel: CSSProperties = {
  fontWeight: 950,
  color: positiveHeading,
  marginBottom: 8,
};

const compareText: CSSProperties = {
  margin: 0,
  color: positiveMuted,
  fontWeight: 700,
  lineHeight: 1.6,
};
