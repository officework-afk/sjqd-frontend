"use client";

import type { KeyboardEvent as ReactKeyboardEvent } from "react";

const focusableSelector = [
  'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([disabled]):not([readonly]):not([data-enter-skip="true"])',
  'select:not([disabled]):not([data-enter-skip="true"])',
  'textarea:not([disabled]):not([readonly]):not([data-enter-skip="true"])',
  'button:not([disabled]):not([data-enter-skip="true"])',
].join(", ");

const isVisible = (element: HTMLElement) => {
  if (element.hasAttribute("hidden")) return false;
  if (element.getAttribute("aria-hidden") === "true") return false;
  if (element.getClientRects().length === 0) return false;

  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
};

const focusElement = (element: HTMLElement) => {
  element.focus();
  element.scrollIntoView({
    block: "nearest",
    inline: "nearest",
    behavior: "smooth",
  });

  if (element instanceof HTMLInputElement) {
    element.select();
  }
};

export const handleEnterAdvance = (
  event: ReactKeyboardEvent<HTMLElement>,
) => {
  if (event.key !== "Enter") return;
  if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
  if (event.defaultPrevented) return;

  const target = event.target;
  const container = event.currentTarget;

  if (!(target instanceof HTMLElement) || !(container instanceof HTMLElement)) {
    return;
  }

  if (target.dataset.enterIgnore === "true" || target.isContentEditable) {
    return;
  }

  if (target.tagName.toLowerCase() === "button") {
    return;
  }

  const nextId = target.dataset.enterNextId;
  if (nextId) {
    const explicitTarget = container.querySelector<HTMLElement>(`#${nextId}`);
    if (!explicitTarget) return;

    event.preventDefault();
    focusElement(explicitTarget);
    return;
  }

  const focusableElements = Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelector),
  ).filter(isVisible);

  const currentIndex = focusableElements.findIndex(
    (element) => element === target || element.contains(target),
  );

  if (currentIndex < 0 || currentIndex >= focusableElements.length - 1) {
    return;
  }

  const nextElement = focusableElements[currentIndex + 1];
  if (!nextElement) return;

  event.preventDefault();
  focusElement(nextElement);
};
