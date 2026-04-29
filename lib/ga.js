/**
 * Safe GA event wrapper — prevents "dataLayer does not exist" warning
 * when sendGAEvent is called before the GA script has initialised.
 */
export function gaEvent(eventName, params = {}) {
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", eventName, params);
    }
  } catch {
    // silently ignore if GA not loaded
  }
}
