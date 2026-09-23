/**
 * Eternity Echoes Live Content & Gallery Engine
 * Loads real-time website text and gallery images directly from Supabase
 */

window.addEventListener('load', () => {
    initContentLoader();
});

async function initContentLoader() {
    try {
        const db = window.supabaseClient;
        if (!db) return;

        // 1. Populate text and media from Supabase site_content
        await loadAllContent(db);

        // 2. Populate gallery grid from Supabase gallery_images
        await loadGallery(db);

        // 3. Add clean admin portal shortcut in footer
        addManagementLink();
    } catch (err) {
        console.warn("Content Engine Notice:", err);
    }
}

// Load dynamic text and media for elements with data-cms-key
async function loadAllContent(db) {
    try {
        const { data: content, error } = await db.from('site_content').select('*');
        if (error || !content) return;

        content.forEach(item => {
            const elements = document.querySelectorAll(`[data-cms-key="${item.section_key}"]`);
            elements.forEach(el => {
                const val = item.content_text || item.content_url;
                if (!val) return;

                if (el.tagName === 'IMG') {
                    el.src = val;
                } else if (el.tagName === 'VIDEO') {
                    const src = el.querySelector('source');
                    if (src) {
                        src.src = val;
                        el.load();
                    }
                } else {
                    el.innerHTML = val;
                }
            });
        });
    } catch (e) {
        console.warn("Could not load dynamic content:", e);
    }
}

// Load gallery photos into the website's gallery grid
async function loadGallery(db) {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;

    try {
        const { data: images, error } = await db
            .from('gallery_images')
            .select('*')
            .order('created_at', { ascending: false });

        if (error || !images || images.length === 0) return;

        grid.innerHTML = images.map(img => `
            <div class="gallery-item">
                <img src="${img.url}" alt="${img.caption || 'EEMG Ministry Photo'}" loading="lazy">
                <div class="gallery-overlay"><p>${img.caption || 'Eternity Echoes'}</p></div>
            </div>
        `).join('');
    } catch (e) {
        console.warn("Could not load gallery images:", e);
    }
}

// Subtle footer link to the admin dashboard
function addManagementLink() {
    const foot = document.querySelector('.footer-bottom-bar') || document.querySelector('.footer-bottom');
    if (foot && !document.getElementById('mgmt-link')) {
        const link = document.createElement('a');
        link.id = 'mgmt-link';
        link.href = "admin.html";
        link.style = "display:inline-block; font-size:0.75rem; opacity:0.35; color:inherit; text-decoration:none; margin-left:1rem;";
        link.innerText = "Admin Portal";
        foot.appendChild(link);
    }
}
