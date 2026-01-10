// CRASH REPORTER (Global Error Handler)
// Sentry Edition

window.CrashReporter = {
    init: function () {
        console.log("🛡️ Crash Reporter Active (Sentry Mode)");

        if (typeof Sentry !== 'undefined') {
            Sentry.init({
                dsn: "https://f6389a36d42bb1089afabd806967030f@o4510686639161344.ingest.us.sentry.io/4510686684315648",
                sendDefaultPii: true,
                integrations: [
                    // Note: In CDN bundle, integrations are usually accessed via Sentry.Integrations or auto-wired if bundles are included
                    // For basic bundle, Replay and Tracing might need separate scripts or specific bundle
                    // We will try standard setup. If CDN bundle includes them, great.
                ],
                // Tracing
                tracesSampleRate: 1.0,
                tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
                // Session Replay
                replaysSessionSampleRate: 0.1,
                replaysOnErrorSampleRate: 1.0
            });
            console.log("✅ Sentry Connected");
        } else {
            console.warn("⚠️ Sentry SDK not loaded.");
        }

        // 1. Runtime Errors
        window.onerror = function (message, source, lineno, colno, error) {
            window.CrashReporter.logError("RUNTIME_ERROR", { message, source, lineno, stack: error ? error.stack : "N/A" }, error);
            // Don't return true, let browser log it too
        };

        // 2. Promise Rejections (Async Errors)
        window.onunhandledrejection = function (event) {
            window.CrashReporter.logError("UNHANDLED_PROMISE", { reason: event.reason }, event.reason);
        };
    },

    logError: function (type, details, originalError) {
        console.error(`🚨 [${type}]`, details);

        // Friendly Toast for User (Gokuldham Style)
        const toast = document.createElement("div");
        toast.innerHTML = `
            <div style="display:flex; align-items:center;">
                <span style="font-size:20px; margin-right:10px;">⚠️</span>
                <div>
                    <strong>Arre Bhide! Error ho gaya!</strong><br>
                    <span style="font-size:0.8em; opacity:0.8;">Don't worry, Tapu Sena (Sentry) is tracing it.</span>
                </div>
            </div>
        `;
        toast.style.cssText = "position:fixed; top:20px; right:20px; background:#e74c3c; color:#fff; padding:15px; border-radius:8px; z-index:99999; box-shadow:0 10px 30px rgba(0,0,0,0.3); font-family:sans-serif; animation: slideIn 0.3s forwards;";
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);

        // Push to Sentry
        if (typeof Sentry !== 'undefined') {
            if (originalError instanceof Error) {
                Sentry.captureException(originalError);
            } else {
                Sentry.captureMessage(`[${type}] ${JSON.stringify(details)}`);
            }
        }
    }
};

// Auto-Init
window.CrashReporter.init();
