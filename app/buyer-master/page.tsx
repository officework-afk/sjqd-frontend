"use client";

import { useEffect, useState } from "react";
import PartyMasterPage from "../components/PartyMasterPage";

interface InterceptedParty {
  id: string | number;
  partyName?: string;
  name?: string;
  gstNo?: string;
  gstNumber?: string;
  phone?: string;
  state?: string;
  pincode?: string;
  address?: string;
  remarks?: string;
  dueDays?: string | number;
  creditDays?: string | number;
}

export default function BuyerMaster() {
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    // Unify and synchronize saved buyer properties inside local storage arrays
    const synchronizeBuyerKeys = () => {
      try {
        const rawData = localStorage.getItem("buyerMaster");
        if (!rawData) return;

        const collection: InterceptedParty[] = JSON.parse(rawData);
        if (!Array.isArray(collection)) return;

        let dataModified = false;
        
        const fixedCollection = collection.map((item) => {
          const resolvedName = item.partyName || item.name || "";
          const resolvedGst = item.gstNo || item.gstNumber || "";
          const resolvedDueDays =
            item.dueDays !== undefined
              ? item.dueDays
              : item.creditDays !== undefined
                ? item.creditDays
                : "15";

          // If properties don't strictly align, bind fallbacks onto both keys simultaneously
          if (
            item.partyName !== resolvedName || 
            item.name !== resolvedName || 
            item.gstNo !== resolvedGst ||
            item.creditDays !== resolvedDueDays ||
            item.dueDays !== resolvedDueDays
          ) {
            dataModified = true;
            return {
              ...item,
              partyName: resolvedName,
              name: resolvedName,
              gstNo: resolvedGst,
              gstNumber: resolvedGst,
              dueDays: resolvedDueDays,
              creditDays: resolvedDueDays
            };
          }
          return item;
        });

        if (dataModified) {
          localStorage.setItem("buyerMaster", JSON.stringify(fixedCollection));
        }
      } catch (err) {
        console.error("Buyer master data unification intercept exception:", err);
      } finally {
        setSynced(true);
      }
    };

    synchronizeBuyerKeys();
  }, []);

  // Escape key handler loop to close/clear elements on command
  useEffect(() => {
    const handleGlobalEscapeKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;

      const active = document.activeElement as HTMLElement | null;
      const isEditingField =
        !!active && ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName);

      if (!isEditingField) return;

      const clearButton =
        Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
          (el) =>
            el.textContent?.toLowerCase().includes("clear") ||
            el.textContent?.toLowerCase().includes("cancel")
        ) || null;

      if (clearButton) {
        e.preventDefault();
        clearButton.click();
        return;
      }

      if (active) {
        e.preventDefault();
        active.blur();
      }
    };

    window.addEventListener("keydown", handleGlobalEscapeKey);
    return () => window.removeEventListener("keydown", handleGlobalEscapeKey);
  }, [synced]);

  // Keyboard Intercept Navigation Engine Loop
  useEffect(() => {
    const handleMasterKeyboardNav = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement;
      if (!activeEl || !["input", "textarea", "select"].includes(activeEl.tagName.toLowerCase())) {
        return;
      }

      // Intercept execution path to let global escape listener work smoothly
      if (e.key === "Escape") return;

      // Query all visible input controls sequentially mapped inside the form card
      const inputElements = Array.from(
        document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
          'input:not([type="hidden"]), textarea, select'
        )
      ).filter(el => {
        // Safely check for search placeholders using getAttribute to avoid select element typescript errors
        const placeholderText = el.getAttribute("placeholder") || "";
        return !placeholderText.toLowerCase().includes("search");
      });

      const currentIdx = inputElements.indexOf(activeEl as any);
      if (currentIdx === -1) return;

      if (e.key === "Enter") {
        if (currentIdx < inputElements.length - 1) {
          e.preventDefault();
          inputElements[currentIdx + 1].focus();
        }
      } else if (e.key === "ArrowDown" && activeEl.tagName.toLowerCase() !== "textarea") {
        if (currentIdx < inputElements.length - 1) {
          e.preventDefault();
          inputElements[currentIdx + 1].focus();
        }
      } else if (e.key === "ArrowUp" && activeEl.tagName.toLowerCase() !== "textarea") {
        if (currentIdx > 0) {
          e.preventDefault();
          inputElements[currentIdx - 1].focus();
        }
      }
    };

    window.addEventListener("keydown", handleMasterKeyboardNav);
    return () => window.removeEventListener("keydown", handleMasterKeyboardNav);
  }, [synced]);

  if (!synced) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "radial-gradient(circle at top left, rgba(255,255,255,0.98) 0%, rgba(255,248,220,0.94) 34%, rgba(245,224,148,0.86) 70%, rgba(214,188,95,0.82) 100%)", color: "#4a3500" }}>
        <div style={{ fontWeight: 800, fontSize: "15px", letterSpacing: "0.5px" }}>Synchronizing Buyer Master Ledger Properties...</div>
      </div>
    );
  }

  return <PartyMasterPage MASTER_TYPE="buyer" />;
}
