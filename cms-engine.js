/**
 * Eternity Echoes CMS Engine v2.0
 * PRO EDITION: Sidebar Dashboard & Email Integration
 */

window.addEventListener('load', () => {
    initCMS();
});

async function initCMS() {
    console.log("CMS: Initializing PRO Dashboard...");
    try {
        const db = window.supabaseClient;
        if (!db) {
            console.error("CMS: Supabase client instance (supabaseClient) not found.");
            return;
        }

        // 1. Load Content
        await loadAllContent(db);
        await loadGallery(db);

        // 2. Check Auth
        const { data: { session } } = await db.auth.getSession();
        
        if (session) {
            // Profile Healing: Ensure the admin exists in the 'admin_profiles' table for RLS to work
            const { data: profile } = await db.from('admin_profiles').select('id').eq('id', session.user.id).single();
            if (!profile) {
                console.log("CMS: No admin profile found, creating one for session user...");
                await db.from('admin_profiles').insert([{ 
                    id: session.user.id, 
                    full_name: session.user.email.split('@')[0],
                    role: 'admin'
                }]);
            }

            showAdminControls();
            if (localStorage.getItem('admin_login_success')) {
                document.getElementById('admin-overlay').style.display = 'flex';
                localStorage.removeItem('admin_login_success');
            }
        }
    } catch (err) {
        console.error("CMS: Init Error", err);
    }
    setupEventListeners();
    addManagementLink();
}

/// --- Email Integration (via Supabase Edge Function - bypasses browser CORS) ---
async function sendRegistrationEmail(userName, userEmail) {
    if (!userName || !userEmail) return;
    console.log(`CMS: Triggering welcome email to ${userEmail}...`);
    try {
        const db = window.supabaseClient;
        if (!db) return;

        // Use the official Supabase invoke method
        const { data, error } = await db.functions.invoke('send-welcome-email', {
            body: { userName, userEmail }
        });

        if (error) throw error;
        console.log("CMS: Welcome email dispatched successfully.", data);
    } catch (err) {
        console.error("CMS: Email dispatch failed", err);
    }
}

// --- Dashboard Logic ---
window.showAdminSection = function(section) {
    // 1. Update Sub-sections visibility
    document.querySelectorAll('.sub-section').forEach(s => s.style.display = 'none');
    const target = document.getElementById(`admin-${section}`);
    if (target) target.style.display = 'block';

    // 2. Update Nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick')?.includes(`'${section}'`)) {
            item.classList.add('active');
        }
    });

    // 3. Update Header Title
    const titleMap = {
        'dashboard': 'Control Center',
        'registrations': 'Attendee Submissions',
        'gallery': 'Ministry Gallery',
        'admins': 'System Management'
    };
    document.getElementById('admin-current-section').innerText = titleMap[section] || 'Admin Dashboard';

    // 4. Special Loads
    if (section === 'dashboard') loadDashboardStats();
    if (section === 'registrations') loadRegistrations();
    if (section === 'gallery') loadAdminGallery();
};

async function loadDashboardStats() {
    const db = window.supabaseClient;
    
    // Count Registrations
    const { count: regCount } = await db.from('conference_registrations').select('*', { count: 'exact', head: true });
    document.getElementById('stat-regs').innerText = regCount || 0;

    // Count Gallery
    const { count: galCount } = await db.from('gallery_images').select('*', { count: 'exact', head: true });
    document.getElementById('stat-gallery').innerText = galCount || 0;
}

function showAdminControls() {
    const authView = document.getElementById('admin-auth');
    const dashboardView = document.getElementById('admin-controls');
    if (authView) authView.style.display = 'none';
    if (dashboardView) dashboardView.style.display = 'flex';
    
    // Ensure "Dashboard" starts active
    showAdminSection('dashboard');

    if (!document.getElementById('admin-fab')) {
        const fab = document.createElement('button');
        fab.id = 'admin-fab';
        fab.className = 'admin-fab';
        fab.innerHTML = '<i data-feather="settings"></i>';
        document.body.appendChild(fab);
        fab.addEventListener('click', () => document.getElementById('admin-overlay').style.display = 'flex');
        feather.replace();
    }

    if (!document.getElementById('save-bar')) {
        const bar = document.createElement('div');
        bar.id = 'save-bar';
        bar.className = 'save-bar';
        bar.innerHTML = 'EDIT MODE ACTIVE - <button id="save-all-bar">Save Final Changes</button>';
        document.body.prepend(bar);
        document.getElementById('save-all-bar').addEventListener('click', window.saveAllContent);
    }
}

// --- Standard CMS Functions ---
async function loadAllContent(db) {
    const { data: content } = await db.from('site_content').select('*');
    if (!content) return;

    content.forEach(item => {
        const elements = document.querySelectorAll(`[data-cms-key="${item.section_key}"]`);
        elements.forEach(el => {
            const val = item.content_text || item.content_url;
            if (el.tagName === 'IMG') el.src = val;
            else if (el.tagName === 'VIDEO') {
                const src = el.querySelector('source');
                if (src) { src.src = val; el.load(); }
            } else el.innerHTML = val;
            
            if (['IMG', 'VIDEO'].includes(el.tagName)) addMediaEditor(el);
        });
    });
}

function addMediaEditor(el) {
    if (el.parentElement.querySelector('.media-edit-overlay')) return;
    if (el.parentElement.style.position !== 'relative') el.parentElement.style.position = 'relative';
    const overlay = document.createElement('div');
    overlay.className = 'media-edit-overlay';
    overlay.innerHTML = `<button class="btn-edit-media" onclick="triggerMediaSwap('${el.getAttribute('data-cms-key')}')"><i data-feather="camera"></i> Change</button>`;
    el.parentElement.appendChild(overlay);
    feather.replace();
}

// --- Event Listeners & Auth ---
function setupEventListeners() {
    const db = window.supabaseClient;

    // Login
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) showToast(error.message, "error");
        else { 
            showToast("Login successful! Entering dashboard...");
            localStorage.setItem('admin_login_success', 'true'); 
            setTimeout(() => location.reload(), 1000);
        }
    });

    // Signup form
    document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        
        showToast("Creating account...", "info");
        const { data, error } = await db.auth.signUp({ email, password });
        
        if (error) return showToast(error.message, "error");
        
        if (data.user) {
            // CRITICAL: Insert into admin_profiles so RLS works
            const { error: profErr } = await db.from('admin_profiles').insert([
                { id: data.user.id, full_name: email.split('@')[0], role: 'admin' }
            ]);
            
            if (profErr) console.error("Profile Error:", profErr);
            
            showToast("Account created! You can now log in.", "success");
            document.getElementById('signup-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
        }
    });

    // Signup Toggle
    document.getElementById('toggle-signup')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('signup-form').style.display = 'block';
    });
    document.getElementById('toggle-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('signup-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
        await db.auth.signOut();
        location.reload();
    });

    // Close Overlay
    document.getElementById('close-admin')?.addEventListener('click', () => {
        document.getElementById('admin-overlay').style.display = 'none';
    });

    // Edit Mode Toggle
    document.getElementById('toggle-edit-mode')?.addEventListener('click', () => {
        const active = document.body.classList.toggle('edit-mode-active');
        document.getElementById('toggle-edit-mode').innerHTML = active ? '<i data-feather="check"></i> Saving Mode On' : '<i data-feather="edit-3"></i> Enable Edit Mode';
        document.querySelectorAll('[data-cms-key]').forEach(el => {
            if (!['IMG', 'VIDEO'].includes(el.tagName)) el.contentEditable = active;
        });
        document.getElementById('save-bar').style.display = active ? 'block' : 'none';
        feather.replace();
    });

    // Content Saving
    window.saveAllContent = async () => {
        showToast("Saving changes...", "info");
        const updates = [];
        document.querySelectorAll('[data-cms-key]').forEach(el => {
            if (!['IMG', 'VIDEO'].includes(el.tagName)) {
                updates.push({ section_key: el.getAttribute('data-cms-key'), content_text: el.innerHTML });
            }
        });
        const { error } = await db.from('site_content').upsert(updates, { onConflict: 'section_key' });
        if (error) showToast(error.message, "error");
        else showToast("Site updated successfully!");
    };
    
    // Gallery Upload
    document.getElementById('gallery-file-input')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        showToast("Uploading...", "info");
        const path = `gallery/${Date.now()}_${file.name}`;
        const { error: upErr } = await db.storage.from('ministry-assets').upload(path, file);
        if (upErr) return showToast(upErr.message, "error");

        const { data: { publicUrl } } = db.storage.from('ministry-assets').getPublicUrl(path);
        await db.from('gallery_images').insert([{ url: publicUrl }]);
        showToast("Gallery updated!");
        loadAdminGallery();
        loadGallery(db);
    });

    // Media Swap
    window.triggerMediaSwap = (key) => {
        window.currentSwapKey = key;
        document.getElementById('cms-media-input').click();
    };
    document.getElementById('cms-media-input')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        showToast("Swapping media...", "info");
        const path = `cms/${Date.now()}_${file.name}`;
        await db.storage.from('ministry-assets').upload(path, file);
        const { data: { publicUrl } } = db.storage.from('ministry-assets').getPublicUrl(path);
        await db.from('site_content').upsert({ section_key: window.currentSwapKey, content_url: publicUrl }, { onConflict: 'section_key' });
        location.reload();
    });
}

// --- Utility Functions ---
async function loadRegistrations() {
    const db = window.supabaseClient;
    if (!db) return;
    
    console.log("CMS: Fetching registrations...");
    const { data: regs, error } = await db.from('conference_registrations').select('*').order('created_at', { ascending: false });
    
    if (error) {
        console.error("CMS: Fetch Error", error);
        showToast("Error loading submissions: " + error.message, "error");
        return;
    }

    console.log(`CMS: Found ${regs?.length || 0} registrations.`);
    const list = document.getElementById('registrations-list');
    if (!regs || !regs.length) { list.innerHTML = '<div class="no-data">No submissions found.</div>'; return; }
    
    list.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th></tr>
            </thead>
            <tbody>
                ${regs.map(r => `<tr><td>${r.full_name}</td><td>${r.email}</td><td>${r.phone}</td><td style="color:#4ade80">Approved</td></tr>`).join('')}
            </tbody>
        </table>
    `;
}

async function loadAdminGallery() {
    const db = window.supabaseClient;
    if (!db) return;
    const { data: images } = await db.from('gallery_images').select('*').order('created_at', { ascending: false });
    const list = document.getElementById('admin-gallery-list');
    list.innerHTML = images?.map(img => `
        <div class="gallery-admin-item">
            <img src="${img.url}">
            <button class="btn-delete" onclick="deleteGalleryImage('${img.id}')"><i data-feather="trash-2"></i></button>
        </div>
    `).join('') || 'Gallery empty.';
    feather.replace();
}

window.deleteGalleryImage = async (id) => {
    const db = window.supabaseClient;
    if (!db || !confirm('Remove this image?')) return;
    await db.from('gallery_images').delete().eq('id', id);
    loadAdminGallery();
    loadGallery(window.supabaseClient);
};

function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i data-feather="${type === 'error' ? 'alert-circle' : 'check-circle'}"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    feather.replace();
    setTimeout(() => toast.classList.add('active'), 10);
    setTimeout(() => { toast.classList.remove('active'); setTimeout(() => toast.remove(), 500); }, 3000);
}

function addManagementLink() {
    const foot = document.querySelector('.footer-bottom');
    if (foot && !document.getElementById('mgmt-link')) {
        const link = document.createElement('a');
        link.id = 'mgmt-link';
        link.href = "#";
        link.style = "display:block; margin-top:2rem; font-size:0.7rem; opacity:0.3; color:#fff;";
        link.innerText = "Access Dashboard";
        link.onclick = (e) => { e.preventDefault(); document.getElementById('admin-overlay').style.display = 'flex'; };
        foot.appendChild(link);
    }
}

async function loadGallery(db) {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;
    const { data: images } = await db.from('gallery_images').select('*').order('created_at', { ascending: false });
    if (!images?.length) return;

    grid.innerHTML = images.map(img => `
        <div class="gallery-item">
            <img src="${img.url}">
            <div class="gallery-overlay"><p>${img.caption || 'EEMG'}</p></div>
        </div>
    `).join('');
}
