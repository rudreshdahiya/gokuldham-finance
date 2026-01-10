// CLOUD SERVICES (Supabase + Stack Auth)
// Replaces services_stub.js with real implementations

const CLOUD_CONFIG = {
    supabaseUrl: "https://inssqicvvbsdpfboazfz.supabase.co",
    supabaseKey: "sb_publishable_2_GInxBEmydd82C3W5aj0A_9_pBTM54",
    stackProjectId: "4ecf6d32-007f-4a3d-a0c7-6a01391b6678",
    stackClientKey: "pck_4re4a45sbcqnd3dys64wcmggw8v5m4pka226tt0g3nrgg"
};

let supabase = null;
let userSession = null;

// Initialize
function initCloud() {
    console.log("☁️ Initializing Cloud Services...");

    // 1. Init Supabase
    if (typeof createClient !== 'undefined') {
        supabase = createClient(CLOUD_CONFIG.supabaseUrl, CLOUD_CONFIG.supabaseKey);
        console.log("✅ Supabase Connected");
    } else {
        console.warn("⚠️ Supabase SDK not found.");
    }

    // 2. Check Session
    checkSession();
}

async function checkSession() {
    if (!supabase) return;
    const { data: { session }, error } = await supabase.auth.getSession();
    if (session) {
        userSession = session;
        console.log("👤 User Logged In:", session.user.email);
        updateAuthUI(true);
    } else {
        console.log("👤 Guest Mode");
        updateAuthUI(false);
    }
}

// Auth Actions (Using Supabase Auth for simplicity as primary, Stack as optional if we can wire it)
// For now, let's use Supabase Magic Link/Email login for easiest integration in vanilla JS
async function login() {
    if (!supabase) return alert("Cloud Offline");

    const email = prompt("Enter your email to sign in / sign up:");
    if (!email) return;

    // Simple Magic Link
    const { data, error } = await supabase.auth.signInWithOtp({ email: email });

    if (error) {
        alert("Login Error: " + error.message);
    } else {
        alert("Check your email for the magic link!");
    }
}

async function logout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    userSession = null;
    updateAuthUI(false);
    alert("Logged out.");
}

// UI Updates
function updateAuthUI(isLoggedIn) {
    const btn = document.getElementById("auth-btn");
    if (!btn) return;

    if (isLoggedIn) {
        btn.innerText = "👤 My Profile";
        btn.onclick = logout; // For now, verify logout
        btn.style.background = "#2ecc71";
    } else {
        btn.innerText = "☁️ Sign In";
        btn.onclick = login;
        btn.style.background = "#3498db";
    }
}

// Data Persistence
async function saveToCloud(profileData) {
    if (!supabase || !userSession) {
        console.warn("☁️ Save skipped: User not logged in.");
        return;
    }

    console.log("☁️ Saving Profile to Cloud...", profileData);

    // We assume a table 'user_profiles' exists. If not, this will fail (User needs to create it in Supabase Dashboard).
    // Structure: { user_id, profile_json, updated_at }

    const { error } = await supabase
        .from('user_profiles')
        .upsert({
            user_id: userSession.user.id,
            profile_data: profileData,
            updated_at: new Date()
        });

    if (error) {
        console.error("❌ Cloud Save Failed:", error);
    } else {
        console.log("✅ Profile Saved to Supabase!");
        // Notify User via subtle toast
        const toast = document.createElement("div");
        toast.innerText = "✅ Saved to Cloud";
        toast.style.cssText = "position:fixed; bottom:20px; right:20px; background:#2ecc71; color:#fff; padding:10px 20px; border-radius:5px; z-index:9999;";
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Expose globally
window.CloudServices = {
    init: initCloud,
    login: login,
    logout: logout,
    save: saveToCloud
};

// Auto-init logic when script loads? No, let script.js call it to be safe.
