
// Initialize Supabase Client
// Note: We rely on the Supabase JS library being loaded via CDN in index.html

let supabaseClient = null;

function initSupabase() {
    if (typeof supabase !== 'undefined' && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_KEY) {
        supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
        console.log("Supabase Initialized");
    } else {
        console.warn("Supabase SDK not loaded or Config missing");
    }
}

async function saveUserSession(data) {
    if (!supabaseClient) initSupabase();
    if (!supabaseClient) return;

    try {
        const { error } = await supabaseClient
            .from('user_sessions')
            .insert([
                {
                    user_profile: data.user_profile,
                    selected_goals: data.selected_goals,
                    rule_recommendation: data.rule_recommendation,
                    final_llm_recommendation: data.final_llm_recommendation || null,
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) throw error;
        console.log("Session saved to Supabase");
    } catch (err) {
        console.error("Error saving session:", err);
    }
}
