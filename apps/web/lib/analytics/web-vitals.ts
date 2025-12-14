/**
 * Web Vitals Reporter
 *
 * Measures and reports Core Web Vitals metrics.
 * Uses web-vitals library for accurate measurements.
 *
 * Metrics:
 * - LCP (Largest Contentful Paint): Loading performance
 * - INP (Interaction to Next Paint): Responsiveness (replaced FID)
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FCP (First Contentful Paint): Initial render
 * - TTFB (Time to First Byte): Server response time
 *
 * @see https://web.dev/articles/vitals
 */

import { onLCP, onINP, onCLS, onFCP, onTTFB, type Metric } from "web-vitals";

/**
 * Web Vitals metric with additional context.
 */
export interface WebVitalsMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  id: string;
  navigationType: string;
}

/**
 * Handler type for web vitals metrics.
 */
export type MetricHandler = (metric: WebVitalsMetric) => void;

/**
 * Default handler that logs metrics to console in development.
 */
function defaultHandler(metric: WebVitalsMetric): void {
  if (process.env.NODE_ENV === "development") {
    const color =
      metric.rating === "good"
        ? "\x1b[32m"
        : metric.rating === "needs-improvement"
          ? "\x1b[33m"
          : "\x1b[31m";
    const reset = "\x1b[0m";

    console.log(
      `${color}[Web Vitals]${reset} ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`
    );
  }
}

/**
 * Transform web-vitals Metric to our WebVitalsMetric type.
 */
function transformMetric(metric: Metric): WebVitalsMetric {
  return {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  };
}

/**
 * Initialize web vitals reporting.
 *
 * @param onReport - Optional custom handler for metrics
 */
export function reportWebVitals(onReport: MetricHandler = defaultHandler): void {
  // Only run on client
  if (typeof window === "undefined") {
    return;
  }

  const handler = (metric: Metric) => {
    onReport(transformMetric(metric));
  };

  // Core Web Vitals
  onLCP(handler);
  onINP(handler); // Replaced FID in 2024
  onCLS(handler);

  // Additional metrics
  onFCP(handler);
  onTTFB(handler);
}

/**
 * Analytics adapter for sending metrics to analytics services.
 * Extend this to integrate with your analytics provider.
 */
export function sendToAnalytics(metric: WebVitalsMetric): void {
  // Example: Send to Google Analytics
  // gtag('event', metric.name, {
  //   value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
  //   event_category: 'Web Vitals',
  //   event_label: metric.id,
  //   non_interaction: true,
  // });

  // Example: Send to custom analytics endpoint
  // fetch('/api/analytics/vitals', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(metric),
  // });

  // For now, just log in development
  defaultHandler(metric);
}

/**
 * Get thresholds for each metric.
 * Based on Google's Core Web Vitals thresholds.
 */
export function getThresholds(metricName: string): { good: number; poor: number } {
  switch (metricName) {
    case "LCP":
      return { good: 2500, poor: 4000 }; // milliseconds
    case "INP":
      return { good: 200, poor: 500 }; // milliseconds
    case "CLS":
      return { good: 0.1, poor: 0.25 }; // score
    case "FCP":
      return { good: 1800, poor: 3000 }; // milliseconds
    case "TTFB":
      return { good: 800, poor: 1800 }; // milliseconds
    default:
      return { good: 0, poor: Infinity };
  }
}
