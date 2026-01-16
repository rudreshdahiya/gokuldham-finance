// TELEMETRY SERVICE
// Wraps Google Analytics & Microsoft Clarity

window.AnalyticsLogger = {
    init: function () {
        console.log("📊 Telemetry Service Initialized");
        this.logEvent("session_start");
    },

    logEvent: function (eventName, props = {}) {
        // Log to Console (Dev)
        console.log(`[📊 TRACK] ${eventName}`, props);

        // 1. Google Analytics (gtag)
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, props);
        }

        // 2. Microsoft Clarity (Custom Tags)
        if (typeof clarity !== 'undefined') {
            // Clarity 'set' API for custom tags
            // clarity("set", key, value);
            // We flatten props for clarity if needed, or just track key events
            if (props.persona) clarity("set", "persona", props.persona);
        }
    }
};

// Auto-init handled by script.js or here?
// script.js calls window.AnalyticsLogger.init() on DOMContentLoaded.
