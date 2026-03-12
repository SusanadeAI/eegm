/**
 * Eternity Echoes CMS Engine v1.2
 * Pro Edition: Gallery, Toasts, and Media Swaps
 */

document.addEventListener('DOMContentLoaded', () => {
    initCMS();
});

async function initCMS() {
    try {
        // 1. Load All Content & Gallery
        await loadAllContent();
        await loadGallery();

        // 2. Check Auth
        if (typeof _supabase !== 'undefined') {
            const { data: { session } } = await _supabase.auth.getSession();
            if (session) {
                showAdminControls();
                if (localStorage.getItem('admin_login_success')) {
                    document.getElementById('admin-overlay').style.display = 'flex';
                    localStorage.removeItem('admin_login_success');
                }
            }
        }
    } catch (err) {
        console.error("CMS: Init Error", err);
    }
    setupEventListeners();
    addManagementLink();
}

// --- Utils: Toast System ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'alert-circle' : 'info');
    toast.innerHTML = `<i data-feather="${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    feather.replace();
    
    setTimeout(() => toast.classList.add('active'), 100);
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// --- Content & Gallery Loading ---
async function loadAllContent() {
    const { data: content, error } = await _supabase.from('site_content').select('*');
    if (error) return console.error("CMS: Content Load Fail", error);

    content.forEach(item => {
        const elements = document.querySelectorAll(`[data-cms-key="${item.section_key}"]`);
        elements.forEach(el => {
            const val = item.content_text || item.content_url;
            if (!val) return;

            if (el.tagName === 'IMG') el.src = val;
            else if (el.tagName === 'VIDEO') {
                const src = el.querySelector('source');
                if (src) { src.src = val; el.load(); }
            } else el.innerHTML = val;

            // Add edit overlay if it's an image/video
            if (el.tagName === 'IMG' || el.tagName === 'VIDEO') {
                addMediaEditor(el);
            }
        });
    });
}

async function loadGallery() {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;

    const { data: images, error } = await _supabase.from('gallery_images').select('*').order('created_at', { ascending: false });
    if (error) return showToast("Failed to load gallery", "error");

    if (!images || images.length === 0) {
        grid.innerHTML = '<p class="text-center w-100 opacity-50">No images in gallery yet.</p>';
        return;
    }

    grid.innerHTML = images.map(img => `
        <div class="gallery-item">
            <img src="${img.url}" alt="${img.caption || ''}">
            <div class="gallery-overlay">
                <p>${img.caption || 'EEMG Ministry'}</p>
            </div>
        </div>
    `).join('');
    feather.replace();
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

window.currentSwapKey = null;
window.triggerMediaSwap = (key) => {
    window.currentSwapKey = key;
    document.getElementById('cms-media-input').click();
};

// --- Admin Features ---
async function setupEventListeners() {
    // Signup
    document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const { error } = await _supabase.auth.signUp({ email, password });
        if (error) showToast(error.message, "error");
        else showToast("Account Created! Use the SQL command to enable your role.", "success");
    });

    // Login
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        const { error } = await _supabase.auth.signInWithPassword({ email, password });
        if (error) showToast(error.message, "error");
        else { localStorage.setItem('admin_login_success', 'true'); location.reload(); }
    });

    // Logout
    window.logoutAdmin = async () => {
        await _supabase.auth.signOut();
        location.reload();
    };

    // Close Admin
    document.getElementById('close-admin')?.addEventListener('click', () => {
        document.getElementById('admin-overlay').style.display = 'none';
    });

    // Toggle Edit Mode
    document.getElementById('toggle-edit-mode')?.addEventListener('click', () => {
        document.body.classList.toggle('edit-mode-active');
        const active = document.body.classList.contains('edit-mode-active');
        document.getElementById('toggle-edit-mode').innerText = active ? 'Disable Edit Mode' : 'Enable Edit Mode';
        document.querySelectorAll('[data-cms-key]').forEach(el => {
            if (!['IMG', 'VIDEO'].includes(el.tagName)) el.contentEditable = active;
        });
        document.getElementById('save-bar').style.display = active ? 'block' : 'none';
    });

    // Save All Text
    document.getElementById('save-all')?.addEventListener('click', async () => {
        const btn = document.getElementById('save-all');
        btn.innerText = 'Saving...';
        const updates = [];
        document.querySelectorAll('[data-cms-key]').forEach(el => {
            if (!['IMG', 'VIDEO'].includes(el.tagName)) {
                updates.push({ section_key: el.getAttribute('data-cms-key'), content_text: el.innerHTML });
            }
        });
        const { error } = await _supabase.from('site_content').upsert(updates, { onConflict: 'section_key' });
        if (error) showToast(error.message, "error");
        else { showToast("Page Content Saved!"); btn.innerText = 'Save Final Changes'; }
    });

    // Media Swapping Logic
    document.getElementById('cms-media-input')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file || !window.currentSwapKey) return;

        showToast("Uploading media...", "info");
        const fileName = `${Date.now()}_${file.name}`;
        const { data, error: uploadErr } = await _supabase.storage.from('ministry-assets').upload(fileName, file);

        if (uploadErr) return showToast(uploadErr.message, "error");

        const { data: { publicUrl } } = _supabase.storage.from('ministry-assets').getPublicUrl(fileName);
        const { error: dbErr } = await _supabase.from('site_content').upsert({ section_key: window.currentSwapKey, content_url: publicUrl }, { onConflict: 'section_key' });

        if (dbErr) showToast(dbErr.message, "error");
        else { showToast("Media updated! Refreshing..."); location.reload(); }
    });

    // Gallery Upload
    document.getElementById('gallery-file-input')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showToast("Uploading to gallery...", "info");
        const fileName = `gallery_${Date.now()}_${file.name}`;
        const { error: uploadErr } = await _supabase.storage.from('ministry-assets').upload(fileName, file);
        if (uploadErr) return showToast(uploadErr.message, "error");

        const { data: { publicUrl } } = _supabase.storage.from('ministry-assets').getPublicUrl(fileName);
        await _supabase.from('gallery_images').insert([{ url: publicUrl }]);
        showToast("Added to Gallery!");
        loadAdminGallery();
        loadGallery();
    });
}

function showAdminControls() {
    const authSection = document.getElementById('admin-auth');
    const controlSection = document.getElementById('admin-controls');
    if (authSection) authSection.style.display = 'none';
    if (controlSection) controlSection.style.display = 'block';
    
    if (!document.getElementById('admin-fab')) {
        const fab = document.createElement('button');
        fab.id = 'admin-fab';
        fab.className = 'admin-fab';
        if (localStorage.getItem('admin_login_success')) fab.classList.add('pulsate');
        fab.innerHTML = '<i data-feather="settings"></i>';
        document.body.appendChild(fab);
        fab.addEventListener('click', () => document.getElementById('admin-overlay').style.display = 'flex');
        feather.replace();
    }

    if (!document.getElementById('save-bar')) {
        const bar = document.createElement('div');
        bar.id = 'save-bar';
        bar.className = 'save-bar';
        bar.innerHTML = 'EDIT MODE ACTIVE - <button id="save-all-bar" class="btn btn-secondary" style="background:#000; color:#fff; padding:5px 15px; margin-left:15px; border-radius:4px;">Save Final Changes</button>';
        document.body.prepend(bar);
        document.getElementById('save-all-bar').addEventListener('click', () => {
            const btn = document.getElementById('save-all');
            if (btn) btn.click();
        });
    }
}

function addManagementLink() {
    const footerBottom = document.querySelector('.footer-bottom');
    if (footerBottom && !document.getElementById('mgmt-link')) {
        const span = document.createElement('span');
        span.id = 'mgmt-link';
        span.style.display = 'block';
        span.style.marginTop = '1rem';
        span.style.fontSize = '0.75rem';
        span.style.opacity = '0.5';
        span.innerHTML = '<a href="#" id="open-admin-link" style="color: inherit; text-decoration: underline;">Site Management</a>';
        footerBottom.appendChild(span);

        document.getElementById('open-admin-link').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('admin-overlay').style.display = 'flex';
        });
    }
}

window.showAdminSection = function(section) {
    document.querySelectorAll('.sub-section').forEach(s => s.style.display = 'none');
    if (section === 'registrations') {
        document.getElementById('admin-registrations').style.display = 'block';
        loadRegistrations();
    } else if (section === 'gallery') {
        document.getElementById('admin-gallery').style.display = 'block';
        loadAdminGallery();
    } else if (section === 'admins') {
        document.getElementById('admin-management').style.display = 'block';
    }
};

async function loadRegistrations() {
    const list = document.getElementById('registrations-list');
    const { data: regs, error } = await _supabase.from('conference_registrations').select('*').order('created_at', { ascending: false });
    
    if (error) return list.innerHTML = '<p class="error">Error loading registrations.</p>';
    if (!regs || !regs.length) return list.innerHTML = '<p>No registrations yet.</p>';

    list.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>City</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${regs.map(r => `
                    <tr>
                        <td>${r.full_name}</td>
                        <td>${r.phone}</td>
                        <td>${r.email}</td>
                        <td>${r.city}</td>
                        <td>${new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function loadAdminGallery() {
    const list = document.getElementById('admin-gallery-list');
    const { data: images } = await _supabase.from('gallery_images').select('*').order('created_at', { ascending: false });
    
    list.innerHTML = images?.map(img => `
        <div class="gallery-admin-item">
            <img src="${img.url}">
            <button class="btn-delete" onclick="deleteGalleryImage('${img.id}')"><i data-feather="trash-2"></i></button>
        </div>
    `).join('') || 'No images.';
    feather.replace();
}

window.deleteGalleryImage = async (id) => {
    if (!confirm('Delete this image?')) return;
    await _supabase.from('gallery_images').delete().eq('id', id);
    showToast("Image deleted");
    loadAdminGallery();
    loadGallery();
};
