/**
 * Eternity Echoes CMS Engine v2.0
 * PRO EDITION: Sidebar Dashboard & Email Integration
 */

document.addEventListener('DOMContentLoaded', () => {
    initCMS();
});

async function initCMS() {
    console.log("CMS: Initializing PRO Dashboard...");
    try {
        if (!window.supabase) {
            console.error("CMS: Supabase client not found.");
            return;
        }

        const db = window.supabase;

        // 1. Load Content
        await loadAllContent(db);
        await loadGallery(db);

        // 2. Check Auth
        const { data: { session } } = await db.auth.getSession();
        
        if (session) {
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

// --- Email Integration (Resend) ---
async function sendRegistrationEmail(userName, userEmail) {
    console.log(`CMS: Sending premium welcome email to ${userEmail}...`);
    try {
        const apiKey = "re_hoNsTPLF_JzdNN4pxu32JmUJ1Tq6amGf6"; 
        
        // --- CUSTOM SENDER SETUP ---
        // Since you connected your domain, you can now change this to:
        // Official Ministry Sender
        const fromEmail = "Eternity Echoes <info@eternityechoes.org>"; 

        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: fromEmail,
                to: [userEmail],
                subject: "✨ Welcome to All Believers Conference 2026!",
                html: `
                    <div style="background-color: #050505; padding: 60px 20px; text-align: center; color: #ffffff; font-family: 'Inter', sans-serif;">
                        <table width="100%" max-width="600" style="margin: 0 auto; background: #0a0a0a; border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 32px; padding: 40px; box-shadow: 0 40px 100px rgba(0,0,0,0.8);">
                            <tr>
                                <td>
                                    <div style="margin-bottom: 30px;">
                                        <img src="https://fztctnfuxbtmqgqcmvyq.supabase.co/storage/v1/object/public/ministry-assets/logo.png" style="height: 50px;">
                                    </div>
                                    <h1 style="font-family: 'Playfair Display', serif; color: #d4af37; font-size: 2.2rem; margin-bottom: 10px; font-weight: 700;">Welcome, ${userName}!</h1>
                                    <p style="font-size: 1.1rem; opacity: 0.8; margin-bottom: 30px;">Your registration for the <strong>All Believers Conference</strong> is confirmed.</p>
                                    
                                    <div style="background: rgba(212, 175, 55, 0.05); border: 1px solid rgba(212, 175, 55, 0.1); border-radius: 20px; padding: 30px; margin-bottom: 30px; text-align: left;">
                                        <h3 style="color: #d4af37; margin-top: 0;">What to Expect:</h3>
                                        <p style="font-size: 0.95rem; opacity: 0.7; line-height: 1.6;">
                                            - Life-changing encounters with the Word.<br>
                                            - Spirit-filled worship and prophetic ministry.<br>
                                            - A community of believers on fire for God.
                                        </p>
                                    </div>

                                    <p style="font-size: 1rem; opacity: 0.7; line-height: 1.6; margin-bottom: 40px;">
                                        Stay tuned to this email for exclusive event updates, schedules, and prayer guides. We cannot wait to see you there!
                                    </p>

                                    <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 30px; text-align: center;">
                                        <p style="font-weight: 700; color: #d4af37; margin: 0;">Eternity Echoes Global Ministry</p>
                                        <p style="font-size: 0.8rem; opacity: 0.4;">"Sounding the Call of Eternity"</p>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </div>
                `
            })
        });

        if (response.ok) {
            console.log("CMS: Premium email delivered via Resend.");
        } else {
            const err = await response.json();
            console.error("CMS: Resend Delivery Failed:", err);
        }
    } catch (err) {
        console.error("CMS: Email send failed", err);
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
    const db = window.supabase;
    
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
    const db = window.supabase;

    // Login
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) showToast(error.message, "error");
        else { localStorage.setItem('admin_login_success', 'true'); location.reload(); }
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
    const { data: regs } = await window.supabase.from('conference_registrations').select('*').order('created_at', { ascending: false });
    const list = document.getElementById('registrations-list');
    if (!regs || !regs.length) { list.innerHTML = 'No submissions found.'; return; }
    
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
    const { data: images } = await window.supabase.from('gallery_images').select('*').order('created_at', { ascending: false });
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
    if (!confirm('Remove this image?')) return;
    await window.supabase.from('gallery_images').delete().eq('id', id);
    loadAdminGallery();
    loadGallery(window.supabase);
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
