"use client";

import { ensureDefaultAccountStorage } from "./defaultAccounts";
import { API_BASE_URL } from "../lib/api";
import { useResponsive } from "./useResponsive";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
};

type MenuItem = {
  label: string;
  path?: string;
  comingSoon?: boolean;
};

type MenuGroup = {
  title: string;
  path?: string;
  items: MenuItem[];
};

export default function AppShell({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile, isTablet } = useResponsive();
  const sidebarRef = useRef<HTMLElement | null>(null);
  const hoverZoneRef = useRef<HTMLDivElement | null>(null);
  const submenuRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<any>({});
  const [hoveredGroup, setHoveredGroup] = useState<string>("");
  const [submenuTop, setSubmenuTop] = useState<number>(120);

  useEffect(() => {
    ensureDefaultAccountStorage();

    try {
      const saved = localStorage.getItem("companyProfile");
      if (saved) setProfile(JSON.parse(saved));
    } catch {
      setProfile({});
    }

    const loadSharedProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/company`);
        if (!res.ok) return;

        const data = await res.json();
        if (!data) return;

        const nextProfile = {
          companyName: data.companyName || "SJQD SOFTWARE",
          logo: data.logo || "",
          phone: data.phone || "",
          email: data.email || "",
        };

        setProfile((prev: any) => ({ ...prev, ...nextProfile }));
        localStorage.setItem(
          "companyProfile",
          JSON.stringify((current => ({ ...current, ...nextProfile }))(
            (() => {
              try {
                return JSON.parse(localStorage.getItem("companyProfile") || "{}");
              } catch {
                return {};
              }
            })(),
          )),
        );
      } catch {
        // local profile remains the fallback
      }
    };

    void loadSharedProfile();
  }, []);

  const closeMenus = useEffectEvent(() => {
    setOpen(false);
    setHoveredGroup("");
  });

  const toggleGroup = useEffectEvent((title: string) => {
    setHoveredGroup((current) => (current === title ? "" : title));
  });

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!open) return;

      const target = event.target as Node;
      const clickedInsideSidebar = sidebarRef.current?.contains(target);
      const clickedHoverZone = hoverZoneRef.current?.contains(target);
      const clickedInsideSubmenu = submenuRef.current?.contains(target);

      if (!clickedInsideSidebar && !clickedHoverZone && !clickedInsideSubmenu) {
        closeMenus();
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  useEffect(() => {
    const handleGlobalEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;

      if (open) {
        event.preventDefault();
        closeMenus();
        return;
      }

      if (pathname && !["/", "/dashboard", "/login", "/register"].includes(pathname)) {
        event.preventDefault();
        router.push("/dashboard");
      }
    };

    window.addEventListener("keydown", handleGlobalEscape);
    return () => window.removeEventListener("keydown", handleGlobalEscape);
  }, [open, pathname, router]);

  const logout = () => {
    localStorage.removeItem("token");
    closeMenus();
    router.push("/login");
  };

  const go = (path: string) => {
    closeMenus();
    router.push(path);
  };

  const groups: MenuGroup[] = [
    {
      title: "INVOICE MASTER",
      items: [
        { label: "Sales", path: "/sales" },
        { label: "Purchase", path: "/purchase" },
        { label: "Sales Return", path: "/sales-return" },
        { label: "Purchase Return", path: "/purchase-return" },
      ],
    },
    {
      title: "STOCK MASTER",
      items: [
        { label: "Stock Summary", path: "/stock-summary" },
        { label: "Item Master", path: "/items" },
      ],
    },
    {
      title: "ALL INVOICE REPORT",
      path: "/all-invoice-report",
      items: [],
    },
    {
      title: "ACCOUNTS",
      items: [
        { label: "Payment", path: "/payment" },
        { label: "Receivable", path: "/receivable" },
        { label: "Cash", path: "/cash" },
        { label: "Bank", path: "/bank" },
      ],
    },
    {
      title: "PARTY MASTER",
      items: [
        { label: "Supplier Master", path: "/supplier-master" },
        { label: "Buyer Master", path: "/buyer-master" },
      ],
    },
  ];

  const activeGroup = groups.find((g) => g.title === hoveredGroup);

  const applyMenuHover = (button: HTMLButtonElement) => {
    button.style.background = "linear-gradient(135deg,#fff8dc,#f7e7a6,#e8c85a)";
    button.style.color = "#2b1d00";
    button.style.transform = "translateX(6px)";
    button.style.boxShadow =
      "0 12px 28px rgba(139,94,0,0.25), inset 0 0 0 1px rgba(180,130,20,0.28)";
    button.style.border = "1px solid rgba(180,130,20,0.42)";
  };

  const removeMenuHover = (button: HTMLButtonElement) => {
    button.style.background = "transparent";
    button.style.color = "#111827";
    button.style.transform = "translateX(0)";
    button.style.boxShadow = "none";
    button.style.border = "1px solid transparent";
  };

  const renderGroupButton = (group: MenuGroup) => (
    <div
      key={group.title}
      style={groupWrap}
      onMouseEnter={(event) => {
        if (isTablet) return;
        const rect = event.currentTarget.getBoundingClientRect();
        setSubmenuTop(Math.max(18, Math.min(rect.top, window.innerHeight - 240)));
        setHoveredGroup(group.title);
      }}
    >
      <button
        type="button"
        style={navBtn}
        onClick={() => {
          if (group.path) {
            go(group.path);
            setHoveredGroup("");
            return;
          }

          toggleGroup(group.title);
        }}
        onMouseEnter={(event) => {
          if (!isTablet) applyMenuHover(event.currentTarget);
        }}
        onMouseLeave={(event) => {
          if (!isTablet) removeMenuHover(event.currentTarget);
        }}
      >
        <span>{group.title}</span>
        {group.items.length > 0 && (
          <span style={arrow}>{hoveredGroup === group.title ? "-" : "+"}</span>
        )}
      </button>

      {isTablet && hoveredGroup === group.title && group.items.length > 0 && (
        <div style={inlineSubMenu}>
          {group.items.map((item) => (
            <button
              type="button"
              key={item.path || item.label}
              style={item.comingSoon ? { ...subBtn, ...comingSoonSubBtn } : subBtn}
              onClick={() => {
                if (item.comingSoon || !item.path) {
                  alert("This option will come soon");
                  return;
                }
                go(item.path);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={layout}>
      {!isTablet && (
        <div
          ref={hoverZoneRef}
          style={hoverZone}
          onMouseEnter={() => setOpen(true)}
        />
      )}

      {isTablet && (
        <button type="button" style={mobileMenuBtn} onClick={() => setOpen(true)}>
          Menu
        </button>
      )}

      <aside
        ref={sidebarRef}
        style={{
          ...sidebar,
          width: isMobile ? "88vw" : 300,
          transform: open ? "translateX(0)" : "translateX(-105%)",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        {isTablet && (
          <div style={mobileSidebarTop}>
            <div style={mobileSidebarLabel}>Navigation</div>
            <button type="button" style={mobileCloseBtn} onClick={closeMenus}>
              x
            </button>
          </div>
        )}

        <div
          style={logoWrap}
          onClick={() => go("/profile")}
          title="Open profile"
        >
          {profile.logo ? (
            <img src={profile.logo} style={logoImg} alt="Company Logo" />
          ) : (
            <span style={logoText}>
              {(profile.companyName || "SJQD SOFTWARE").slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        <h2 style={{ ...companyName, fontSize: isMobile ? 21 : 24 }}>
          {profile.companyName || "SJQD SOFTWARE"}
        </h2>

        <div style={sideContent}>
          <div style={topMenu}>
            <button
              type="button"
              style={navBtn}
              onClick={() => go("/dashboard")}
              onMouseEnter={(event) => {
                setHoveredGroup("");
                if (!isTablet) applyMenuHover(event.currentTarget);
              }}
              onMouseLeave={(event) => {
                if (!isTablet) removeMenuHover(event.currentTarget);
              }}
            >
              DASHBOARD
            </button>

            {groups.map(renderGroupButton)}
          </div>

          <div style={bottomMenu}>
            <button
              type="button"
              style={navBtn}
              onClick={() => go("/settings")}
              onMouseEnter={(event) => {
                setHoveredGroup("");
                if (!isTablet) applyMenuHover(event.currentTarget);
              }}
              onMouseLeave={(event) => {
                if (!isTablet) removeMenuHover(event.currentTarget);
              }}
            >
              SETTINGS
            </button>

            <button
              type="button"
              style={navBtn}
              onClick={() => go("/feature-updation-plans")}
              onMouseEnter={(event) => {
                setHoveredGroup("");
                if (!isTablet) applyMenuHover(event.currentTarget);
              }}
              onMouseLeave={(event) => {
                if (!isTablet) removeMenuHover(event.currentTarget);
              }}
            >
              FEATURE ROADMAP
            </button>

            <button
              type="button"
              style={navBtn}
              onClick={() => go("/subscription")}
              onMouseEnter={(event) => {
                setHoveredGroup("");
                if (!isTablet) applyMenuHover(event.currentTarget);
              }}
              onMouseLeave={(event) => {
                if (!isTablet) removeMenuHover(event.currentTarget);
              }}
            >
              SUBSCRIPTION
            </button>

            <button
              type="button"
              style={logoutBtn}
              onClick={logout}
              onMouseEnter={() => setHoveredGroup("")}
            >
              LOGOUT
            </button>
          </div>
        </div>
      </aside>

      {open && activeGroup && activeGroup.items.length > 0 && !isTablet && (
        <div
          ref={submenuRef}
          style={{ ...rightSubMenu, top: submenuTop }}
          onMouseEnter={() => setHoveredGroup(activeGroup.title)}
        >
          <div style={subMenuTitle}>{activeGroup.title}</div>
          {activeGroup.items.map((item) => (
            <button
              type="button"
              key={item.path || item.label}
              style={item.comingSoon ? { ...subBtn, ...comingSoonSubBtn } : subBtn}
              onClick={() => {
                if (item.comingSoon || !item.path) {
                  alert("This option will come soon");
                  return;
                }
                go(item.path);
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background =
                  "linear-gradient(135deg,#fff8dc,#f4df8d)";
                event.currentTarget.style.border =
                  "1px solid rgba(180,130,20,0.38)";
                event.currentTarget.style.transform = "translateX(4px)";
                event.currentTarget.style.boxShadow =
                  "0 8px 20px rgba(139,94,0,0.20)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = item.comingSoon
                  ? "#f8fafc"
                  : "rgba(255,255,255,0.95)";
                event.currentTarget.style.border = "1px solid rgba(0,0,0,0.08)";
                event.currentTarget.style.transform = "translateX(0)";
                event.currentTarget.style.boxShadow = "none";
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {open && <div style={backdrop} />}

      <main style={{ ...main, paddingTop: isTablet ? 72 : 0 }}>{children}</main>
    </div>
  );
}

const layout: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(255,255,255,0.98) 0%, rgba(255,248,220,0.94) 32%, rgba(245,224,148,0.86) 70%, rgba(214,188,95,0.82) 100%)",
};

const hoverZone: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: 18,
  height: "100vh",
  zIndex: 2600,
};

const sidebar: React.CSSProperties = {
  position: "fixed",
  top: 0,
  bottom: 0,
  left: 0,
  zIndex: 2800,
  padding: "26px 24px 20px",
  background: "linear-gradient(180deg,#fffdf0,#fff8dc)",
  borderRight: "1px solid rgba(0,0,0,0.08)",
  boxShadow: "12px 0 40px rgba(0,0,0,0.22)",
  transition: "transform 0.32s ease",
  overflowY: "auto",
  overflowX: "hidden",
};

const backdrop: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 2400,
  background: "rgba(91,64,0,0.12)",
};

const logoWrap: React.CSSProperties = {
  width: 140,
  height: 140,
  borderRadius: "50%",
  margin: "10px auto 20px",
  background: "linear-gradient(135deg,#ffffff,#f3ead2)",
  border: "5px solid white",
  boxShadow: "0 15px 35px rgba(0,0,0,0.2)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  cursor: "pointer",
};

const logoImg: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const logoText: React.CSSProperties = {
  fontSize: 48,
  fontWeight: 950,
  color: "#6b4d00",
};

const companyName: React.CSSProperties = {
  textAlign: "center",
  color: "#4a3400",
  fontWeight: 950,
  letterSpacing: 1.5,
  margin: "0 0 24px",
};

const sideContent: React.CSSProperties = {
  minHeight: "calc(100vh - 250px)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: 22,
};

const topMenu: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const bottomMenu: React.CSSProperties = {
  display: "grid",
  gap: 12,
  paddingBottom: 10,
};

const groupWrap: React.CSSProperties = {
  position: "relative",
};

const navBtn: React.CSSProperties = {
  width: "100%",
  border: "1px solid transparent",
  color: "#111827",
  background: "transparent",
  padding: "15px 16px",
  borderRadius: 16,
  fontSize: 15,
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  textAlign: "left",
  transition: "all 0.24s ease",
};

const arrow: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 950,
  lineHeight: 1,
};

const rightSubMenu: React.CSSProperties = {
  position: "fixed",
  left: 326,
  minWidth: 270,
  padding: 12,
  borderRadius: 18,
  background: "rgba(255,253,240,0.98)",
  boxShadow: "0 20px 42px rgba(0,0,0,0.25)",
  border: "1px solid rgba(180,130,20,0.20)",
  display: "grid",
  gap: 8,
  zIndex: 3500,
};

const subMenuTitle: React.CSSProperties = {
  color: "#3b2a00",
  fontWeight: 950,
  padding: "4px 8px 8px",
  fontSize: 13,
  letterSpacing: 0.6,
};

const subBtn: React.CSSProperties = {
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.95)",
  color: "#111827",
  padding: "13px 14px",
  borderRadius: 14,
  fontSize: 15,
  fontWeight: 900,
  cursor: "pointer",
  textAlign: "left",
  transition: "all 0.22s ease",
};

const inlineSubMenu: React.CSSProperties = {
  display: "grid",
  gap: 8,
  padding: "8px 8px 2px 10px",
};

const comingSoonSubBtn: React.CSSProperties = {
  opacity: 0.72,
  cursor: "not-allowed",
  background: "#f8fafc",
  color: "#92400e",
};

const logoutBtn: React.CSSProperties = {
  border: "none",
  color: "white",
  padding: "18px 16px",
  borderRadius: 18,
  fontSize: 17,
  fontWeight: 950,
  cursor: "pointer",
  background: "linear-gradient(135deg,#dc2626,#f87171)",
  boxShadow: "0 10px 20px rgba(220,38,38,0.28)",
};

const main: React.CSSProperties = {
  minHeight: "100vh",
};

const mobileMenuBtn: React.CSSProperties = {
  position: "fixed",
  top: 14,
  left: 14,
  zIndex: 3600,
  border: "1px solid rgba(184,134,11,0.26)",
  borderRadius: 14,
  padding: "12px 16px",
  background: "rgba(255,255,255,0.94)",
  color: "#4a3400",
  fontWeight: 950,
  boxShadow: "0 14px 28px rgba(91,64,0,0.14)",
  cursor: "pointer",
};

const mobileSidebarTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 12,
};

const mobileSidebarLabel: React.CSSProperties = {
  color: "#8d6716",
  textTransform: "uppercase",
  letterSpacing: 0.8,
  fontSize: 12,
  fontWeight: 950,
};

const mobileCloseBtn: React.CSSProperties = {
  width: 40,
  height: 40,
  border: "none",
  borderRadius: 12,
  background: "#ef4444",
  color: "white",
  fontSize: 20,
  fontWeight: 950,
  cursor: "pointer",
};
