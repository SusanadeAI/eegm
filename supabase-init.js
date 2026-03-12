// Supabase Configuration
const SUPABASE_URL = 'https://fztctnfuxbtmqgqcmvyq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dGN0bmZ1eGJ0bXFncWNtdnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjE1NDAsImV4cCI6MjA4ODgzNzU0MH0.y9KC5URsGGvpBEu5sYAkneg1z1Su-vlMs-5Xvg0qBTY';

// Initialize Supabase Client
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export to window object for universal access
window.supabase = client;
window._supabase = client; // Legacy support for any scripts using _supabase
