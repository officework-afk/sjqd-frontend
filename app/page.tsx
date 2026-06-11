"use client";

import Image from "next/image";
import Link from "next/link";
import { useResponsive } from "./components/useResponsive";

const strengths = [
  "Sales, purchase and return billing in one software",
  "Barcode-ready item management and stock tracking",
  "Cash, bank and pending amount flow in one place",
  "Professional GST billing with clean printable reports",
];

const featureCards = [
  {
    title: "Billing Flow",
    text: "Create sales, purchase, return and GST-ready invoices with item, quantity, rate and tax details in one screen.",
  },
  {
    title: "Barcode + Stock",
    text: "Use barcode-based entry, item master and stock summary together so billing stays fast and inventory stays controlled.",
  },
  {
    title: "Accounts Control",
    text: "Track receivable, payment, cash and bank movement with simple summaries that are easy to understand.",
  },
  {
    title: "Business Clarity",
    text: "See reports, party masters, totals and day-to-day billing activity in one connected workflow.",
  },
];

const advantages = [
  "Works in browser on mobile, Mac, Windows and desktop screens",
  "Clean gold-and-royal interface that feels professional in front of customers",
  "Fast B2C billing with quick Cash and Bank A/C options",
  "Single system for billing, stock, GST, accounts and reports",
  "Simple party master and item master for repeat entries",
  "Printable professional output for invoices and summary reports",
];

const audience = [
  "Retail shops and barcode-based counters",
  "Small distributors and wholesalers",
  "GST billing teams that want faster daily entry",
  "Owners who need stock, cash and sales in one software",
];

export default function HomePage() {
  const { isMobile, isTablet } = useResponsive();

  return (
    <main style={page}>
      <section
        style={{
          ...heroSection,
          gridTemplateColumns: isTablet ? "1fr" : "minmax(0,1.15fr) minmax(360px,0.85fr)",
          padding: isMobile ? "22px 16px" : "42px 40px",
        }}
      >
        <div style={heroCopy}>
          <div style={brandChip}>Royal Billing and Business Management</div>

          <h1
            style={{
              ...heroTitle,
              fontSize: isMobile ? 30 : isTablet ? 56 : 72,
              lineHeight: isMobile ? 1.08 : 0.98,
            }}
          >
            SJQD Software for Billing, Stock, GST and Daily Business Control
          </h1>

          <p
            style={{
              ...heroText,
              fontSize: isMobile ? 16 : 21,
              maxWidth: 760,
            }}
          >
            A professional business billing software that helps you manage sales,
            purchase, barcode billing, GST, receivable, payment, cash, bank and
            stock in one connected workflow.
          </p>

          <div
            style={{
              ...heroBulletGrid,
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2,minmax(0,1fr))",
            }}
          >
            {strengths.map((item) => (
              <div key={item} style={heroBullet}>
                <span style={heroBulletDot}>•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              ...ctaRow,
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <Link className="royal-hover" href="/login" style={{ ...primaryLink, width: isMobile ? "100%" : 190 }}>
              Login
            </Link>
            <Link className="royal-hover" href="/register" style={{ ...secondaryLink, width: isMobile ? "100%" : 190 }}>
              Register
            </Link>
          </div>

          <div
            style={{
              ...assuranceRow,
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "stretch" : "center",
            }}
          >
            <div
              style={{
                ...assuranceCard,
                flex: isMobile ? "0 1 auto" : assuranceCard.flex,
                minHeight: isMobile ? 0 : undefined,
              }}
            >
              <div style={assuranceLabel}>Platform Support</div>
              <div style={assuranceValue}>Mobile, Mac, Windows, Desktop Browser</div>
            </div>
            <div
              style={{
                ...assuranceCard,
                flex: isMobile ? "0 1 auto" : assuranceCard.flex,
                minHeight: isMobile ? 0 : undefined,
              }}
            >
              <div style={assuranceLabel}>Ideal For</div>
              <div style={assuranceValue}>Retail, wholesale, billing counters, GST teams</div>
            </div>
          </div>
        </div>

        <div
          style={{
            ...heroVisualCard,
            padding: isMobile ? 18 : heroVisualCard.padding,
          }}
        >
          <div
            style={{
              ...visualTop,
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <div style={logoPlate}>
              <Image
                src="/logo.png"
                alt="SJQD Software Logo"
                width={120}
                height={120}
                priority
                style={logo}
              />
            </div>

            <div style={visualBadge}>Business Billing Suite</div>
          </div>

          <div style={visualPanel}>
            <div style={visualPanelTitle}>What visitors understand immediately</div>
            <div style={visualPanelText}>
              This software is built for fast billing, better stock control,
              professional invoices and cleaner daily accounts management.
            </div>
          </div>

          <div
            style={{
              ...visualMiniGrid,
              gridTemplateColumns: isMobile ? "repeat(2,minmax(0,1fr))" : visualMiniGrid.gridTemplateColumns,
            }}
          >
            <div style={miniCard}>
              <div style={miniLabel}>Sales + Purchase</div>
              <div style={miniValue}>One connected workflow</div>
            </div>
            <div style={miniCard}>
              <div style={miniLabel}>Barcode + GST</div>
              <div style={miniValue}>Ready for daily billing</div>
            </div>
            <div style={miniCard}>
              <div style={miniLabel}>Cash + Bank</div>
              <div style={miniValue}>Simple account tracking</div>
            </div>
            <div style={miniCard}>
              <div style={miniLabel}>Responsive Use</div>
              <div style={miniValue}>Phone, laptop and desktop friendly</div>
            </div>
          </div>
        </div>
      </section>

      <section style={sectionWrap}>
        <div style={sectionHead}>
          <span style={sectionEyebrow}>Why This Software Is Strong</span>
          <h2 style={{ ...sectionTitle, fontSize: isMobile ? 30 : sectionTitle.fontSize }}>
            Positive points and business advantages
          </h2>
          <p style={sectionText}>
            When someone opens your website, they should quickly understand that
            SJQD Software is not only for billing, but for running day-to-day
            business operations with more speed and control.
          </p>
        </div>

        <div
          style={{
            ...featureGrid,
            gridTemplateColumns: isMobile
              ? "1fr"
              : isTablet
              ? "repeat(2,minmax(0,1fr))"
              : "repeat(4,minmax(0,1fr))",
          }}
        >
          {featureCards.map((card) => (
            <article
              key={card.title}
              style={{
                ...featureCard,
                padding: isMobile ? "20px 18px" : featureCard.padding,
              }}
            >
              <h3 style={{ ...featureTitle, fontSize: isMobile ? 20 : featureTitle.fontSize }}>
                {card.title}
              </h3>
              <p style={{ ...featureText, fontSize: isMobile ? 16 : undefined }}>{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        style={{
          ...advantageSection,
          gridTemplateColumns: isTablet ? "1fr" : "minmax(0,1fr) minmax(320px,0.9fr)",
        }}
      >
        <div>
          <span style={sectionEyebrow}>Why businesses choose it</span>
          <h2 style={{ ...sectionTitle, fontSize: isMobile ? 30 : sectionTitle.fontSize }}>
            A software that looks premium and works practically
          </h2>
          <p style={{ ...sectionText, fontSize: isMobile ? 16 : sectionText.fontSize }}>
            SJQD Software combines an elegant presentation with real business
            utility. It helps reduce repeated work, keeps masters organized and
            makes invoice and accounts tasks easier for staff and owners.
          </p>

          <div style={advantageList}>
            {advantages.map((item) => (
              <div
                key={item}
                style={{
                  ...advantageItem,
                  padding: isMobile ? "13px 14px" : advantageItem.padding,
                }}
              >
                <span style={advantageMark}>+</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...devicePanel, padding: isMobile ? 18 : devicePanel.padding }}>
          <div style={{ ...deviceTitle, fontSize: isMobile ? 24 : deviceTitle.fontSize }}>
            Cross-device usage
          </div>
          <div style={deviceText}>
            Open the software in a browser and use it on:
          </div>
          <div style={deviceList}>
            <div style={deviceCard}>Mobile phones for quick checks and entry</div>
            <div style={deviceCard}>Mac browsers for clean office use</div>
            <div style={deviceCard}>Windows desktop and laptop counters</div>
            <div style={deviceCard}>Large monitor billing desks and reports</div>
          </div>
        </div>
      </section>

      <section style={sectionWrap}>
        <div style={sectionHead}>
          <span style={sectionEyebrow}>Best Fit</span>
          <h2 style={{ ...sectionTitle, fontSize: isMobile ? 30 : sectionTitle.fontSize }}>
            Who can use SJQD Software
          </h2>
        </div>

        <div
          style={{
            ...audienceGrid,
            gridTemplateColumns: isMobile
              ? "1fr"
              : isTablet
              ? "repeat(2,minmax(0,1fr))"
              : "repeat(4,minmax(0,1fr))",
          }}
        >
          {audience.map((item) => (
            <div key={item} style={audienceCard}>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...ctaSection, padding: isMobile ? "28px 18px" : "38px 42px" }}>
        <div>
          <div style={{ ...ctaTitle, fontSize: isMobile ? 24 : ctaTitle.fontSize }}>
            See the software, understand the value, then login and use it
          </div>
          <div style={{ ...ctaText, fontSize: isMobile ? 16 : undefined }}>
            This website now introduces the software clearly before sign-in, so
            visitors can understand the product and then continue to login or
            registration with confidence.
          </div>
        </div>

        <div
          style={{
            ...ctaRow,
            flexDirection: isMobile ? "column" : "row",
            marginTop: isMobile ? 20 : 0,
          }}
        >
          <Link className="royal-hover" href="/login" style={{ ...primaryLink, width: isMobile ? "100%" : 190 }}>
            Login Now
          </Link>
          <Link className="royal-hover" href="/register" style={{ ...secondaryLinkAlt, width: isMobile ? "100%" : 190 }}>
            Create Account
          </Link>
        </div>
      </section>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  padding: "24px clamp(16px,3vw,36px) 60px",
  background:
    "radial-gradient(circle at top left, rgba(255,255,255,0.98) 0%, rgba(255,248,220,0.95) 28%, rgba(245,224,148,0.87) 68%, rgba(214,188,95,0.84) 100%)",
  color: "#3f2a00",
  display: "grid",
  gap: 24,
  overflowX: "hidden",
};

const heroSection: React.CSSProperties = {
  display: "grid",
  gap: 24,
  alignItems: "stretch",
  minWidth: 0,
  background: "linear-gradient(145deg,rgba(255,255,255,0.95),rgba(255,247,217,0.92))",
  borderRadius: 34,
  border: "1px solid rgba(184,134,11,0.22)",
  boxShadow: "0 28px 70px rgba(103,73,4,0.16)",
};

const heroCopy: React.CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: 20,
  minWidth: 0,
};

const brandChip: React.CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  alignItems: "center",
  gap: 8,
  padding: "10px 16px",
  borderRadius: 999,
  background: "rgba(255,248,220,0.9)",
  border: "1px solid rgba(184,134,11,0.28)",
  color: "#7c5a10",
  fontWeight: 900,
  letterSpacing: 0.6,
  textTransform: "uppercase",
  fontSize: 12,
};

const heroTitle: React.CSSProperties = {
  margin: 0,
  color: "#1c2438",
  fontWeight: 950,
  overflowWrap: "anywhere",
};

const heroText: React.CSSProperties = {
  margin: 0,
  color: "#5d6d86",
  lineHeight: 1.7,
  fontWeight: 700,
  minWidth: 0,
};

const heroBulletGrid: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const heroBullet: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  padding: "12px 14px",
  minWidth: 0,
  borderRadius: 18,
  background: "rgba(255,255,255,0.78)",
  border: "1px solid rgba(184,134,11,0.16)",
  fontWeight: 800,
  color: "#4a3500",
  lineHeight: 1.5,
};

const heroBulletDot: React.CSSProperties = {
  color: "#c8871c",
  fontSize: 24,
  lineHeight: 1,
  marginTop: -2,
};

const ctaRow: React.CSSProperties = {
  display: "flex",
  gap: 14,
  alignItems: "center",
  flexWrap: "wrap",
};

const primaryLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 56,
  padding: "0 24px",
  borderRadius: 16,
  background: "linear-gradient(135deg,#b66a14,#d99a2f)",
  color: "#fffdf8",
  fontWeight: 900,
  fontSize: 18,
  textDecoration: "none",
  boxShadow: "0 16px 32px rgba(182,106,20,0.26)",
};

const secondaryLink: React.CSSProperties = {
  ...primaryLink,
  background: "rgba(255,255,255,0.85)",
  color: "#9a5f11",
  border: "2px solid rgba(182,106,20,0.72)",
  boxShadow: "none",
};

const secondaryLinkAlt: React.CSSProperties = {
  ...secondaryLink,
  background: "rgba(255,250,238,0.96)",
};

const assuranceRow: React.CSSProperties = {
  display: "flex",
  gap: 14,
  flexWrap: "wrap",
};

const assuranceCard: React.CSSProperties = {
  flex: "1 1 260px",
  padding: "16px 18px",
  borderRadius: 20,
  background: "rgba(255,255,255,0.82)",
  border: "1px solid rgba(184,134,11,0.18)",
};

const assuranceLabel: React.CSSProperties = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 0.8,
  color: "#8d6a20",
  fontWeight: 900,
};

const assuranceValue: React.CSSProperties = {
  marginTop: 6,
  color: "#263246",
  fontSize: 17,
  fontWeight: 850,
  lineHeight: 1.5,
};

const heroVisualCard: React.CSSProperties = {
  display: "grid",
  gap: 16,
  alignContent: "start",
  minWidth: 0,
  width: "100%",
  padding: 24,
  borderRadius: 28,
  background:
    "linear-gradient(160deg,rgba(31,41,55,0.95),rgba(58,37,2,0.88) 42%,rgba(212,175,55,0.90) 100%)",
  color: "#fffef9",
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
};

const visualTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  flexWrap: "wrap",
};

const logoPlate: React.CSSProperties = {
  width: 136,
  height: 136,
  flexShrink: 0,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  background: "rgba(255,255,255,0.92)",
  boxShadow: "0 24px 48px rgba(0,0,0,0.24)",
};

const logo: React.CSSProperties = {
  width: 112,
  height: 112,
  objectFit: "cover",
  borderRadius: "50%",
};

const visualBadge: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.16)",
  fontWeight: 800,
  fontSize: 13,
  letterSpacing: 0.5,
};

const visualPanel: React.CSSProperties = {
  padding: "18px 18px 16px",
  minWidth: 0,
  borderRadius: 22,
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.12)",
};

const visualPanelTitle: React.CSSProperties = {
  fontSize: 21,
  fontWeight: 900,
  lineHeight: 1.25,
};

const visualPanelText: React.CSSProperties = {
  marginTop: 8,
  color: "rgba(255,255,255,0.82)",
  lineHeight: 1.65,
  fontWeight: 700,
  minWidth: 0,
};

const visualMiniGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: 12,
  minWidth: 0,
};

const miniCard: React.CSSProperties = {
  padding: "16px 14px",
  minWidth: 0,
  borderRadius: 18,
  background: "rgba(255,255,255,0.11)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const miniLabel: React.CSSProperties = {
  color: "#f5df95",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 0.7,
  fontWeight: 900,
};

const miniValue: React.CSSProperties = {
  marginTop: 8,
  fontSize: 16,
  lineHeight: 1.45,
  fontWeight: 850,
  overflowWrap: "anywhere",
};

const sectionWrap: React.CSSProperties = {
  display: "grid",
  gap: 20,
};

const sectionHead: React.CSSProperties = {
  maxWidth: 840,
  minWidth: 0,
};

const sectionEyebrow: React.CSSProperties = {
  display: "inline-block",
  color: "#8d6716",
  fontSize: 13,
  fontWeight: 900,
  letterSpacing: 0.8,
  textTransform: "uppercase",
};

const sectionTitle: React.CSSProperties = {
  margin: "10px 0 0",
  fontSize: 36,
  color: "#1c2438",
  fontWeight: 950,
  lineHeight: 1.15,
  overflowWrap: "anywhere",
};

const sectionText: React.CSSProperties = {
  margin: "10px 0 0",
  color: "#5d6d86",
  lineHeight: 1.7,
  fontWeight: 700,
  fontSize: 17,
  minWidth: 0,
};

const featureGrid: React.CSSProperties = {
  display: "grid",
  gap: 16,
  minWidth: 0,
};

const featureCard: React.CSSProperties = {
  padding: "24px 20px",
  minWidth: 0,
  borderRadius: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,0.92),rgba(255,248,220,0.86))",
  border: "1px solid rgba(184,134,11,0.18)",
  boxShadow: "0 20px 40px rgba(103,73,4,0.10)",
};

const featureTitle: React.CSSProperties = {
  margin: 0,
  color: "#1f2937",
  fontSize: 24,
  fontWeight: 900,
  lineHeight: 1.18,
  overflowWrap: "anywhere",
};

const featureText: React.CSSProperties = {
  margin: "10px 0 0",
  color: "#5d6d86",
  lineHeight: 1.7,
  fontWeight: 700,
  minWidth: 0,
};

const advantageSection: React.CSSProperties = {
  display: "grid",
  gap: 20,
  alignItems: "start",
  minWidth: 0,
  padding: "28px clamp(18px,2.5vw,34px)",
  borderRadius: 30,
  background: "linear-gradient(145deg,rgba(255,255,255,0.9),rgba(246,231,167,0.86))",
  border: "1px solid rgba(184,134,11,0.2)",
};

const advantageList: React.CSSProperties = {
  display: "grid",
  gap: 12,
  marginTop: 18,
  minWidth: 0,
};

const advantageItem: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  padding: "14px 16px",
  minWidth: 0,
  borderRadius: 18,
  background: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(184,134,11,0.14)",
  color: "#3f2a00",
  fontWeight: 800,
  lineHeight: 1.55,
};

const advantageMark: React.CSSProperties = {
  color: "#c8871c",
  fontWeight: 950,
  fontSize: 20,
  lineHeight: 1,
};

const devicePanel: React.CSSProperties = {
  padding: 22,
  minWidth: 0,
  borderRadius: 24,
  background:
    "linear-gradient(165deg,rgba(33,41,52,0.96),rgba(65,47,9,0.9) 58%,rgba(212,175,55,0.86) 100%)",
  color: "white",
};

const deviceTitle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 950,
  lineHeight: 1.15,
  overflowWrap: "anywhere",
};

const deviceText: React.CSSProperties = {
  marginTop: 8,
  color: "rgba(255,255,255,0.82)",
  fontWeight: 700,
  lineHeight: 1.65,
};

const deviceList: React.CSSProperties = {
  display: "grid",
  gap: 12,
  marginTop: 18,
};

const deviceCard: React.CSSProperties = {
  padding: "16px 16px",
  minWidth: 0,
  borderRadius: 18,
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.12)",
  fontWeight: 800,
  lineHeight: 1.55,
};

const audienceGrid: React.CSSProperties = {
  display: "grid",
  gap: 14,
  minWidth: 0,
};

const audienceCard: React.CSSProperties = {
  padding: "18px 18px",
  minWidth: 0,
  borderRadius: 20,
  background: "rgba(255,255,255,0.88)",
  border: "1px solid rgba(184,134,11,0.16)",
  color: "#3f2a00",
  fontWeight: 850,
  lineHeight: 1.55,
  boxShadow: "0 18px 36px rgba(103,73,4,0.08)",
};

const ctaSection: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 22,
  flexWrap: "wrap",
  alignItems: "center",
  minWidth: 0,
  borderRadius: 30,
  background: "linear-gradient(135deg,#fffef8,#f6e7a7)",
  border: "1px solid rgba(184,134,11,0.2)",
  boxShadow: "0 20px 46px rgba(103,73,4,0.10)",
};

const ctaTitle: React.CSSProperties = {
  color: "#1c2438",
  fontSize: 30,
  fontWeight: 950,
  lineHeight: 1.18,
  overflowWrap: "anywhere",
};

const ctaText: React.CSSProperties = {
  marginTop: 10,
  color: "#5d6d86",
  fontWeight: 700,
  lineHeight: 1.7,
  maxWidth: 760,
};
