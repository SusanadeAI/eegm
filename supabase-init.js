// Supabase Configuration
const SUPABASE_URL = 'https://fztctnfuxbtmqgqcmvyq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dGN0bmZ1eGJ0bXFncWNtdnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjE1NDAsImV4cCI6MjA4ODgzNzU0MH0.y9KC5URsGGvpBEu5sYAkneg1z1Su-vlMs-5Xvg0qBTY';

// Capture the Library reference carefully
// The CDN sets window.supabase = the library object
const sbLibrary = window.supabase;

if (!sbLibrary || !sbLibrary.createClient) {
    console.error("Supabase Error: SDK Library not loaded correctly from CDN.");
}

// Initialize the Client Instance
// We use a SPECIFIC name to avoid overwriting the Global Library
const clientInstance = sbLibrary.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export specifically named objects to avoid naming collisions
window.supabaseClient = clientInstance;

// Legacy/Fallback support
// We only set this if it's not already the library, but safer to just use the new name
window._supabase = clientInstance;

console.log("Supabase: Client Instance initialized as window.supabaseClient");
