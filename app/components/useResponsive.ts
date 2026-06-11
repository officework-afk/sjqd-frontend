"use client";

import { useLayoutEffect, useState } from "react";

type ResponsiveState = {
  width: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
};

const getWidth = () => {
  if (typeof window === "undefined") return 0;

  const widths = [
    window.innerWidth,
    document.documentElement?.clientWidth || 0,
    Math.round(window.visualViewport?.width || 0),
  ].filter((value) => value > 0);

  return widths.length > 0 ? Math.min(...widths) : 0;
};

export function useResponsive(): ResponsiveState {
  const [width, setWidth] = useState(getWidth);

  useLayoutEffect(() => {
    let timeoutId = 0;
    let frameId = 0;

    const updateWidth = () => setWidth(getWidth());
    const scheduleUpdate = () => {
      updateWidth();

      window.clearTimeout(timeoutId);
      cancelAnimationFrame(frameId);

      frameId = window.requestAnimationFrame(updateWidth);
      timeoutId = window.setTimeout(updateWidth, 180);
    };

    scheduleUpdate();
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("orientationchange", scheduleUpdate);
    window.visualViewport?.addEventListener("resize", scheduleUpdate);

    return () => {
      window.clearTimeout(timeoutId);
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("orientationchange", scheduleUpdate);
      window.visualViewport?.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return {
    width,
    isMobile: width <= 768,
    isTablet: width <= 1100,
    isDesktop: width > 1100,
  };
}
