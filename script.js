// ==========================================================================
// ETERNITY ECHOES GLOBAL MINISTRY — ELEVATION INTERACTION & SLIDER ENGINE
// Features: Full-Screen Slideshow, Auto-Rotation, Touch Swipes, Copy Details
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Feather Icons safely
    if (window.feather) {
        feather.replace();
    }

    // 2. Full-Screen Elevation Hero Slideshow Logic
    const sliderContainer = document.getElementById('hero');
    const slides = document.querySelectorAll('#hero-slider .slide');
    const dots = document.querySelectorAll('#slider-dots .dot');
    const prevBtn = document.getElementById('slider-prev');
    const nextBtn = document.getElementById('slider-next');

    let currentSlide = 0;
    let slideInterval = null;
    const AUTO_DELAY = 6500; // 6.5s auto slide

    function updateSlideVideo(slide, shouldPlay) {
        const video = slide.querySelector('video');
        if (video) {
            if (shouldPlay) {
                video.currentTime = 0;
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        }
    }

    function goToSlide(index) {
        if (!slides.length) return;

        // Wrap around bounds
        if (index < 0) {
            currentSlide = slides.length - 1;
        } else if (index >= slides.length) {
            currentSlide = 0;
        } else {
            currentSlide = index;
        }

        slides.forEach((slide, i) => {
            const isActive = i === currentSlide;
            slide.classList.toggle('active', isActive);
            updateSlideVideo(slide, isActive);
        });

        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });
    }

    function nextSlide() {
        goToSlide(currentSlide + 1);
    }

    function prevSlide() {
        goToSlide(currentSlide - 1);
    }

    function startAutoSlide() {
        stopAutoSlide();
        slideInterval = setInterval(nextSlide, AUTO_DELAY);
    }

    function stopAutoSlide() {
        if (slideInterval) {
            clearInterval(slideInterval);
            slideInterval = null;
        }
    }

    if (slides.length > 0) {
        // Arrow Buttons
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                prevSlide();
                startAutoSlide(); // Reset auto timer
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                nextSlide();
                startAutoSlide(); // Reset auto timer
            });
        }

        // Pagination Dots
        dots.forEach((dot) => {
            dot.addEventListener('click', () => {
                const targetIdx = parseInt(dot.getAttribute('data-index'), 10);
                if (!isNaN(targetIdx)) {
                    goToSlide(targetIdx);
                    startAutoSlide();
                }
            });
        });

        // Hover pause on desktop
        if (sliderContainer) {
            sliderContainer.addEventListener('mouseenter', stopAutoSlide);
            sliderContainer.addEventListener('mouseleave', startAutoSlide);

            // Touch Swipe support for mobile
            let touchStartX = 0;
            let touchEndX = 0;

            sliderContainer.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            sliderContainer.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                const swipeDiff = touchStartX - touchEndX;
                if (Math.abs(swipeDiff) > 50) {
                    if (swipeDiff > 0) {
                        nextSlide(); // Swiped left -> next
                    } else {
                        prevSlide(); // Swiped right -> prev
                    }
                    startAutoSlide();
                }
            }, { passive: true });
        }

        // Start auto-slide on load
        startAutoSlide();
    }

    // 3. Navigation Header Scroll Elevation Effect
    const header = document.getElementById('main-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }, { passive: true });
    }

    // 4. Slide-Out Navigation Drawer (Elevation Menu)
    const mobileToggle = document.getElementById('mobile-toggle');
    const drawer = document.getElementById('nav-drawer');
    const drawerOverlay = document.getElementById('nav-drawer-overlay');
    const drawerCloseBtn = document.getElementById('drawer-close-btn');

    function openDrawer() {
        if (drawer) drawer.classList.add('active');
        if (drawerOverlay) drawerOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        if (drawer) drawer.classList.remove('active');
        if (drawerOverlay) drawerOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (mobileToggle) {
        mobileToggle.addEventListener('click', (e) => {
            e.preventDefault();
            openDrawer();
        });
    }

    if (drawerCloseBtn) {
        drawerCloseBtn.addEventListener('click', closeDrawer);
    }

    if (drawerOverlay) {
        drawerOverlay.addEventListener('click', closeDrawer);
    }

    if (drawer) {
        drawer.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeDrawer);
        });
    }

    // 5. Click-to-copy Bank Account Numbers
    const copyElements = document.querySelectorAll('.copyable-account');
    copyElements.forEach(acc => {
        acc.style.cursor = 'pointer';
        acc.addEventListener('click', () => {
            const textToCopy = acc.getAttribute('data-account') || acc.innerText.replace(/[^0-9]/g, '');
            const showSuccess = () => {
                const originalHtml = acc.innerHTML;
                acc.innerHTML = `<span style="color: var(--gold-primary); font-weight: 800;">Copied! ✓</span>`;
                setTimeout(() => {
                    acc.innerHTML = originalHtml;
                    if (window.feather) feather.replace();
                }, 2200);
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy).then(showSuccess).catch(() => {
                    fallbackCopy(textToCopy, showSuccess);
                });
            } else {
                fallbackCopy(textToCopy, showSuccess);
            }
        });
    });

    function fallbackCopy(text, callback) {
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = text;
        tempTextArea.style.position = 'fixed';
        tempTextArea.style.opacity = '0';
        document.body.appendChild(tempTextArea);
        tempTextArea.focus();
        tempTextArea.select();
        try {
            document.execCommand('copy');
            if (callback) callback();
        } catch (e) {
            console.warn('Fallback copy failed', e);
        }
        document.body.removeChild(tempTextArea);
    }

    // 6. Top Scroll Progress Indicator
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress-bar';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        if (total > 0) {
            const pct = (window.scrollY / total) * 100;
            progressBar.style.width = `${pct}%`;
        }
    }, { passive: true });

    // 7. Navigation Search Bar Filter / Smooth Jump
    const searchInput = document.getElementById('nav-search-input');
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.toLowerCase().trim();
                if (!query) return;

                if (query.includes('founder') || query.includes('elisha') || query.includes('pastor') || query.includes('setman')) {
                    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                } else if (query.includes('ministr') || query.includes('worship') || query.includes('mission')) {
                    document.getElementById('ministries')?.scrollIntoView({ behavior: 'smooth' });
                } else if (query.includes('crusade') || query.includes('impact') || query.includes('aponmu') || query.includes('sijuwade')) {
                    document.getElementById('crusades')?.scrollIntoView({ behavior: 'smooth' });
                } else if (query.includes('testim') || query.includes('healing') || query.includes('miracle')) {
                    document.getElementById('testimonies')?.scrollIntoView({ behavior: 'smooth' });
                } else if (query.includes('give') || query.includes('partner') || query.includes('account') || query.includes('bank')) {
                    document.getElementById('give')?.scrollIntoView({ behavior: 'smooth' });
                } else if (query.includes('conference')) {
                    window.location.href = 'conference.html';
                } else {
                    // Try to match any text on the page
                    const elements = document.querySelectorAll('h2, h3, h4, p');
                    for (let el of elements) {
                        if (el.innerText.toLowerCase().includes(query)) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            el.style.transition = 'background 0.5s';
                            const origBg = el.style.background;
                            el.style.background = 'rgba(197, 155, 39, 0.2)';
                            setTimeout(() => { el.style.background = origBg; }, 2000);
                            break;
                        }
                    }
                }
            }
        });
    }
});
