"use client";

import { useEffect } from "react";
import { reportWebVitals, sendToAnalytics } from "@/lib/analytics/web-vitals";

/**
 * Web Vitals Reporter Component
 *
 * Client-side component that initializes Core Web Vitals measurement.
 * Should be placed in the root layout.
 *
 * Metrics measured:
 * - LCP (Largest Contentful Paint)
 * - INP (Interaction to Next Paint)
 * - CLS (Cumulative Layout Shift)
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 */
export function WebVitalsReporter() {
  useEffect(() => {
    // Initialize web vitals reporting on mount
    reportWebVitals(sendToAnalytics);
  }, []);

  // This component doesn't render anything
  return null;
}
