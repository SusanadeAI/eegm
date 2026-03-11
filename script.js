// Initialize Feather Icons
feather.replace();

// Handle Sticky Header on Scroll
const header = document.getElementById('main-header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Implementation of Scroll Reveals
const revealElements = document.querySelectorAll('.reveal');
function checkReveal() {
    const triggerBottom = window.innerHeight / 5 * 4;
    revealElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        if (elementTop < triggerBottom) {
            element.classList.add('active');
        } else {
            // Keep elements active once revealed for better UX
            // element.classList.remove('active');
        }
    });
}

window.addEventListener('scroll', checkReveal);
window.addEventListener('load', checkReveal);

// Mobile Menu Toggle (Simplified)
const mobileToggle = document.getElementById('mobile-toggle');
const navMenu = document.getElementById('nav-menu');

mobileToggle.addEventListener('click', () => {
    navMenu.querySelector('.nav-links').classList.toggle('active');
    // Change icon based on state
    if (navMenu.querySelector('.nav-links').classList.contains('active')) {
        mobileToggle.innerHTML = '<i data-feather="x"></i>';
    } else {
        mobileToggle.innerHTML = '<i data-feather="menu"></i>';
    }
    feather.replace();
});

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.querySelector('.nav-links').classList.remove('active');
        mobileToggle.innerHTML = '<i data-feather="menu"></i>';
        feather.replace();
    });
});

// Smooth scroll implementation (already handled by CSS, but good to ensure accessibility)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 80, // Offset for sticky header
                behavior: 'smooth'
            });
            
            // Update active link
            document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

// Add some subtle parallax or mouse move effect on hero section for that "world-class" feel
const hero = document.getElementById('hero');
if(hero) {
    hero.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const moveX = (clientX - centerX) / 50;
        const moveY = (clientY - centerY) / 50;
        hero.style.backgroundPosition = `calc(50% + ${moveX}px) calc(50% + ${moveY}px)`;
    });
}
