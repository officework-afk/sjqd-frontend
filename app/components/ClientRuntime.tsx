"use client";

import { useLayoutEffect } from "react";
import { API_BASE_URL } from "../lib/api";

const GLOBAL_STORAGE_KEYS = new Set(["token", "user"]);
const USER_STORAGE_PREFIX = "sjqd:user:";

type RuntimeWindow = Window & {
  __sjqdRuntimePatched?: boolean;
};

const getScopedUserId = (readRaw: (key: string) => string | null) => {
  try {
    const rawUser = readRaw("user");
    if (!rawUser) return "";

    const parsed = JSON.parse(rawUser);
    return String(parsed?.id || parsed?.userId || "").trim();
  } catch {
    return "";
  }
};

const shouldScopeStorageKey = (key: string) => {
  const cleanKey = String(key || "").trim();
  return (
    cleanKey.length > 0 &&
    !GLOBAL_STORAGE_KEYS.has(cleanKey) &&
    !cleanKey.startsWith(USER_STORAGE_PREFIX)
  );
};

const buildScopedStorageKey = (
  key: string,
  readRaw: (key: string) => string | null,
) => {
  const cleanKey = String(key || "").trim();
  if (!shouldScopeStorageKey(cleanKey)) {
    return cleanKey;
  }

  const userId = getScopedUserId(readRaw);
  return userId ? `${USER_STORAGE_PREFIX}${userId}:${cleanKey}` : cleanKey;
};

const shouldAttachTokenToUrl = (urlText: string) => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const requestUrl = new URL(urlText, window.location.origin);
    const configuredApiUrl = new URL(API_BASE_URL, window.location.origin);
    const currentHost = String(window.location.hostname || "").trim().toLowerCase();
    const requestHost = String(requestUrl.hostname || "").trim().toLowerCase();

    if (requestUrl.origin === configuredApiUrl.origin) {
      return true;
    }

    if (requestUrl.port !== "5000") {
      return false;
    }

    return (
      requestHost === currentHost ||
      requestHost === "127.0.0.1" ||
      requestHost === "localhost"
    );
  } catch {
    return false;
  }
};

export default function ClientRuntime() {
  useLayoutEffect(() => {
    const runtimeWindow = window as RuntimeWindow;

    if (runtimeWindow.__sjqdRuntimePatched) {
      return;
    }

    const storageProto = Object.getPrototypeOf(window.localStorage) as Storage;
    const rawGetItem = storageProto.getItem;
    const rawSetItem = storageProto.setItem;
    const rawRemoveItem = storageProto.removeItem;
    const originalFetch = window.fetch.bind(window);

    storageProto.getItem = function patchedGetItem(key: string) {
      if (this !== window.localStorage) {
        return rawGetItem.call(this, key);
      }

      return rawGetItem.call(this, buildScopedStorageKey(key, (rawKey) => rawGetItem.call(this, rawKey)));
    };

    storageProto.setItem = function patchedSetItem(key: string, value: string) {
      if (this !== window.localStorage) {
        rawSetItem.call(this, key, value);
        return;
      }

      rawSetItem.call(
        this,
        buildScopedStorageKey(key, (rawKey) => rawGetItem.call(this, rawKey)),
        value,
      );
    };

    storageProto.removeItem = function patchedRemoveItem(key: string) {
      if (this !== window.localStorage) {
        rawRemoveItem.call(this, key);
        return;
      }

      rawRemoveItem.call(
        this,
        buildScopedStorageKey(key, (rawKey) => rawGetItem.call(this, rawKey)),
      );
    };

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input, init);

      if (!shouldAttachTokenToUrl(request.url)) {
        return originalFetch(input, init);
      }

      const token = rawGetItem.call(window.localStorage, "token");

      if (!token) {
        return originalFetch(input, init);
      }

      const headers = new Headers(request.headers);

      if (!headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return originalFetch(new Request(request, { headers }));
    };

    runtimeWindow.__sjqdRuntimePatched = true;
  }, []);

  return null;
}
