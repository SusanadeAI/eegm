/**
 * Eternity Echoes CMS Engine v1.0
 * Handles Dyamic Content, Auth, and Edit Mode
 */

document.addEventListener('DOMContentLoaded', () => {
    initCMS();
});

async function initCMS() {
    try {
        console.log("CMS: Initializing...");
        // 1. Load All Dynamic Content
        await loadAllContent();

        // 2. Check Auth Status
        if (typeof supabase !== 'undefined') {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                showAdminControls();

                // Auto-open if we just logged in
                if (localStorage.getItem('admin_login_success')) {
                    document.getElementById('admin-overlay').style.display = 'flex';
                    localStorage.removeItem('admin_login_success');
                }
            }
        }
    } catch (err) {
        console.error("CMS: Initialization failed, falling back to static content.", err);
    }

    // 3. Setup Listeners
    setupEventListeners();
}

// --- Content Loading ---
async function loadAllContent() {
    // Load Site Content (Headers, Paragraphs, URLs)
    const { data: content, error } = await supabase.from('site_content').select('*');
    if (error) {
        console.warn("CMS: Failed to fetch site content.", error.message);
        return;
    }

    if (content && content.length > 0) {
        content.forEach(item => {
            const elements = document.querySelectorAll(`[data-cms-key="${item.section_key}"]`);
            elements.forEach(el => {
                try {
                    const value = item.content_text || item.content_url;
                    if (!value) return; // Skip empty content

                    if (el.tagName === 'IMG') {
                        el.src = value;
                    } else if (el.tagName === 'VIDEO') {
                        const source = el.querySelector('source');
                        if (source) source.src = value;
                        el.load();
                    } else {
                        el.innerHTML = value;
                    }
                } catch (e) {
                    console.error("CMS Load Error for key:", item.section_key, e);
                }
            });
        });
    } else {
        console.log("CMS: No dynamic content found in database. Using defaults.");
    }
}

// --- Auth & Admin ---
async function setupEventListeners() {
    // Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('admin-email').value;
            const password = document.getElementById('admin-password').value;
            
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) alert('Login failed: ' + error.message);
            else {
                localStorage.setItem('admin_login_success', 'true');
                location.reload(); // Refresh to apply admin state
            }
        });
    }

    // Admin FAB (To open panel)
    const fab = document.getElementById('admin-fab');
    if (fab) {
        fab.addEventListener('click', () => {
            document.getElementById('admin-overlay').style.display = 'flex';
        });
    }

    // Close Admin
    const closeBtn = document.getElementById('close-admin');
    if(closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('admin-overlay').style.display = 'none';
        });
    }

    // Toggle Edit Mode
    const editBtn = document.getElementById('toggle-edit-mode');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            document.body.classList.toggle('edit-mode-active');
            const isActive = document.body.classList.contains('edit-mode-active');
            editBtn.innerText = isActive ? 'Disable Edit Mode' : 'Enable Edit Mode';
            
            // Toggle contenteditable on all CMS elements
            document.querySelectorAll('[data-cms-key]').forEach(el => {
                if (el.tagName !== 'IMG' && el.tagName !== 'VIDEO') {
                    el.contentEditable = isActive;
                }
            });

            if (isActive) {
                document.getElementById('save-bar').style.display = 'block';
            } else {
                document.getElementById('save-bar').style.display = 'none';
            }
        });
    }

    // Save Changes
    const saveBtn = document.getElementById('save-all');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            saveBtn.innerText = 'Saving...';
            const updates = [];
            document.querySelectorAll('[data-cms-key]').forEach(el => {
                const key = el.getAttribute('data-cms-key');
                const content = el.innerHTML;
                updates.push({ section_key: key, content_text: content });
            });

            const { error } = await supabase.from('site_content').upsert(updates, { onConflict: 'section_key' });
            if (error) alert('Save failed: ' + error.message);
            else {
                saveBtn.innerText = 'All Changes Saved!';
                setTimeout(() => { saveBtn.innerText = 'Save Final Changes'; }, 2000);
            }
        });
    }

    // Add New Admin
    const addAdminForm = document.getElementById('add-admin-form');
    if (addAdminForm) {
        addAdminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('new-admin-email').value;
            const password = document.getElementById('new-admin-password').value;
            
            // Supabase Admin API is usually for server-side, 
            // but we can use signUp if enabled or a custom edge function.
            // For now, we use public signUp.
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) alert('Error: ' + error.message);
            else alert('Admin invitation sent/created!');
        });
    }
}

function showAdminControls() {
    const authSection = document.getElementById('admin-auth');
    const controlSection = document.getElementById('admin-controls');
    if (authSection) authSection.style.display = 'none';
    if (controlSection) controlSection.style.display = 'block';
    
    // Show Floating Action Button
    if (!document.getElementById('admin-fab')) {
        const fab = document.createElement('button');
        fab.id = 'admin-fab';
        fab.className = 'admin-fab';
        // Pulsate if just logged in
        if (localStorage.getItem('admin_login_success')) {
            fab.classList.add('pulsate');
            setTimeout(() => fab.classList.remove('pulsate'), 10000); // Pulsate for 10s
        }
        fab.innerHTML = '<i data-feather="settings"></i>';
        document.body.appendChild(fab);
        feather.replace();
    }

    // Show Save Bar (hidden initially)
    if (!document.getElementById('save-bar')) {
        const bar = document.createElement('div');
        bar.id = 'save-bar';
        bar.className = 'save-bar';
        bar.innerHTML = 'EDIT MODE ACTIVE - <button id="save-all" class="btn btn-secondary" style="margin-left: 10px; padding: 5px 15px; background: #000; color: #fff;">Save Final Changes</button>';
        document.body.prepend(bar);
    }
}

// Add a visible Management link to the footer
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

// Run management link after DOM load
document.addEventListener('DOMContentLoaded', addManagementLink);

// Section Switcher for Admin Panel
window.showAdminSection = function(section) {
    document.querySelectorAll('.sub-section').forEach(s => s.style.display = 'none');
    if (section === 'registrations') {
        document.getElementById('admin-registrations').style.display = 'block';
        loadRegistrations();
    } else if (section === 'admins') {
        document.getElementById('admin-management').style.display = 'block';
    }
}

async function loadRegistrations() {
    const list = document.getElementById('registrations-list');
    const { data: regs, error } = await supabase.from('conference_registrations').select('*').order('created_at', { ascending: false });
    
    if (error) list.innerHTML = 'Error loading registrations.';
    else if (regs.length === 0) list.innerHTML = 'No registrations yet.';
    else {
        let html = '<table class="admin-table"><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Campus</th><th>Date</th></tr></thead><tbody>';
        regs.forEach(r => {
            html += `<tr>
                <td>${r.full_name}</td>
                <td>${r.phone}</td>
                <td>${r.email}</td>
                <td>${r.campus || 'N/A'}</td>
                <td>${new Date(r.created_at).toLocaleDateString()}</td>
            </tr>`;
        });
        html += '</tbody></table>';
        list.innerHTML = html;
    }
}
