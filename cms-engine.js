/**
 * Eternity Echoes CMS Engine v2.0
 * PRO EDITION: Sidebar Dashboard & Email Integration
 */

window.addEventListener('load', () => {
    console.warn("🚀 CMS LOADING: VERSION 3.0 - BYPASSING ALL EDGE FUNCTIONS");
    initCMS();
});

async function initCMS() {
    console.log("CMS: Initializing PRO Dashboard...");
    try {
        const db = window.supabaseClient;
        if (!db) return;

        // 1. Load Content
        await loadAllContent(db);
        await loadGallery(db);

        // 2. Check Auth
        const { data: { session } } = await db.auth.getSession();
        
        if (session) {
            // Profile Healing: Absolute guarantee that admin exists in safe DB table
            const { data: profile } = await db.from('admin_profiles').select('id').eq('id', session.user.id).single();
            if (!profile) {
                console.log("CMS: Healing admin profile...");
                await db.from('admin_profiles').upsert([{ 
                    id: session.user.id, 
                    full_name: session.user.email.split('@')[0],
                    role: 'admin'
                }]);
            }

            showAdminControls();
            
            // Only show modal if the user just logged in (localStorage flag set in login handler)
            if (localStorage.getItem('admin_login_success')) {
                document.getElementById('admin-overlay').classList.add('active');
                localStorage.removeItem('admin_login_success');
            }

            // Persistence Check: If logged in but modal was closed, don't reopen
            if (sessionStorage.getItem('admin_modal_closed')) {
                document.getElementById('admin-overlay').classList.remove('active');
            }
        }
        setupEventListeners();
        addManagementLink();
    } catch (err) {
        console.error("CMS: Init Error", err);
    }
}

/// --- Direct Resend Integration (Browser-side) ---
async function sendDirectResendEmail(userName, userEmail) {
    const RESEND_API_KEY = "re_hoNsTPLF_JzdNN4pxu32JmUJ1Tq6amGf6"; // Hardcoded as requested
    
    console.log(`CMS: Direct Resend attempt to ${userEmail}...`);
    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: "Eternity Echoes <info@eternityechoes.org>",
                to: [userEmail],
                subject: "✨ Welcome to All Believers Conference 2026!",
                html: `
                    <div style="font-family:sans-serif; padding:40px; color:#333; background:#f9f9f9; border-radius:32px;">
                        <h1 style="color:#d4af37;">Welcome, ${userName}!</h1>
                        <p>Your registration is confirmed. We look forward to seeing you at the <strong>All Believers Conference</strong>.</p>
                        <br>
                        <p>Blessings,<br>Eternity Echoes Global Ministry</p>
                    </div>
                `
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Resend API Error");
        
        console.log("CMS: Direct email sent!", result);
        showToast("Success: Welcome email sent directly!", "success");
    } catch (err) {
        console.error("CMS: Direct Email Failed", err);
        showToast("Email Failed (Direct): " + err.message, "error");
    }
}

async function sendRegistrationEmail(userName, userEmail) {
    if (!userName || !userEmail) return;
    
    // Default to Direct Browser Sending as requested
    await sendDirectResendEmail(userName, userEmail);
    
    /* 
    Legacy Edge Function Call (Keep for reference)
    try {
        const db = window.supabaseClient;
        if (!db) return;
        const { error } = await db.functions.invoke('send-welcome-email', { body: { userName, userEmail } });
        if (error) throw error;
    } catch (err) { console.error(err); } 
    */
}

async function sendTestEmail() {
    const db = window.supabaseClient;
    if (!db) return;
    
    console.log("CMS: Attempting test email...");
    const { data: { user } } = await db.auth.getUser();
    if (!user) return showToast("Please login first", "error");

    showToast("Sending test email to your admin address...", "info");
    
    // Switch to direct Resend browser sending
    await sendDirectResendEmail("Admin Test", user.email);
    showToast("Test email sent successfully! Check your inbox.");
}

window.closeAdminOverlay = () => {
    document.getElementById('admin-overlay').classList.remove('active');
    sessionStorage.setItem('admin_modal_closed', 'true');
};

// --- Dashboard Logic ---
window.showAdminSection = (section) => {
    // 1. Update Sub-sections visibility
    document.querySelectorAll('.sub-section').forEach(s => s.style.display = 'none');
    const target = document.getElementById(`admin-${section}`);
    if (target) target.style.display = 'block';
    
    // Always reset registration view to table when switching to submissions
    if (section === 'registrations') {
        document.getElementById('registrations-table-view').style.display = 'block';
        document.getElementById('registrations-detail-view').style.display = 'none';
    }

    // 2. Update Nav active state
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector(`[onclick="showAdminSection('${section}')"]`)?.classList.add('active');

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
        document.getElementById('admin-overlay').classList.remove('active');
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
    
    const { data: regs, error } = await db.from('conference_registrations').select('*').order('created_at', { ascending: false });
    
    if (error) {
        showToast("Error loading submissions: " + error.message, "error");
        return;
    }

    const list = document.getElementById('registrations-list');
    if (!regs || !regs.length) { 
        list.innerHTML = '<div style="padding:4rem; text-align:center; opacity:0.3;">No submissions found.</div>'; 
        return; 
    }
    
    list.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th>Date Received</th>
                </tr>
            </thead>
            <tbody>
                ${regs.map(reg => `
                    <tr onclick="showRegistrationDetail('${reg.id}')" style="cursor:pointer;" title="Click to view full details">
                        <td>${new Date(reg.created_at).toLocaleDateString()}</td>
                        <td><strong>${reg.full_name}</strong></td>
                        <td>${reg.email}</td>
                        <td><span class="badge badge-success">Submitted</span></td>
                        <td><i data-feather="chevron-right"></i></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    feather.replace();
}

window.showRegistrationDetail = async (id) => {
    const db = window.supabaseClient;
    const tableView = document.getElementById('registrations-table-view');
    const detailView = document.getElementById('registrations-detail-view');
    const content = document.getElementById('registration-detail-content');
    
    tableView.style.display = 'none';
    detailView.style.display = 'block';
    content.innerHTML = '<div class="loader-inline">Fetching full record...</div>';

    const { data: reg, error } = await db.from('conference_registrations').select('*').eq('id', id).single();
    
    if (error) {
        content.innerHTML = `<div class="error-msg">Error: ${error.message}</div>`;
        return;
    }

    document.getElementById('detail-reg-name').innerText = reg.full_name;

    const fields = [
        ['Full Name', reg.full_name],
        ['Email', reg.email],
        ['Phone', reg.phone],
        ['Gender', reg.gender],
        ['Registration Type', reg.registration_type],
        ['Church/Ministry', reg.church_ministry],
        ['City', reg.city],
        ['State/Country', reg.state_country],
        ['Campus', reg.campus],
        ['Attends Church?', reg.attend_church ? 'Yes' : 'No'],
        ['Church Location', reg.church_location],
        ['Church Role', reg.church_role],
        ['Hear About Us', reg.hear_about],
        ['Coming with Others?', reg.attending_with_others ? `Yes (${reg.others_count})` : 'No'],
        ['Bus Pickup?', reg.bus_location || 'None'],
        ['Accommodation?', reg.require_accommodation ? `Yes: ${reg.accommodation_details}` : 'No'],
        ['Receive Updates?', reg.receive_updates ? 'Yes' : 'No'],
        ['Preferences', reg.update_preference?.join(', ') || 'None'],
        ['Prayer Request', reg.prayer_request || 'N/A']
    ];

    content.innerHTML = `
        <div class="detail-view-card">
            <div class="detail-grid">
                ${fields.map(([label, val]) => `
                    <div class="detail-item">
                        <label>${label}</label>
                        <p>${val === true ? 'Yes' : (val === false ? 'No' : (val || ''))}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    feather.replace();
};

window.closeDetailView = () => {
    document.getElementById('registrations-table-view').style.display = 'block';
    document.getElementById('registrations-detail-view').style.display = 'none';
};

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
        link.onclick = (e) => { 
            e.preventDefault(); 
            document.getElementById('admin-overlay').classList.add('active'); 
        };
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
