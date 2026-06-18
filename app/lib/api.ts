const REMOTE_API_BASE_URL = "https://sjqd-backend.vercel.app";

const isLocalHostname = (hostname: string) => {
  const value = String(hostname || "").trim().toLowerCase();

  return (
    value === "localhost" ||
    value === "127.0.0.1" ||
    value === "::1" ||
    value.endsWith(".local") ||
    value.startsWith("192.168.") ||
    value.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(value)
  );
};

const resolveBrowserApiBaseUrl = () => {
  const configured = String(process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();

  if (configured) {
    return configured;
  }

  if (typeof window === "undefined") {
    return REMOTE_API_BASE_URL;
  }

  const hostname = String(window.location.hostname || "").trim();

  if (!isLocalHostname(hostname)) {
    return REMOTE_API_BASE_URL;
  }

  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  return `${protocol}//${hostname}:5000`;
};

export const API_BASE_URL = resolveBrowserApiBaseUrl();
