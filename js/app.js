// ==================== SUPABASE SETUP ====================
const SUPABASE_URL = 'https://jzbhmsjxzuemwkuptvul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Ymhtc2p4enVlbXdrdXB0dnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDg5NDgsImV4cCI6MjA5NTMyNDk0OH0.8jpPdznF63QdLmerZrYs5r6rUzG2Y7dgffu62b-A4Wg';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== GALLERY SLIDESHOW ====================
let currentSlide = 0;

function changeSlide(n) {
    const slides = document.getElementsByClassName("slide");
    if (slides.length === 0) return;

    currentSlide = (currentSlide + n + slides.length) % slides.length;

    Array.from(slides).forEach(slide => {
        slide.classList.remove("active");
    });
    slides[currentSlide].classList.add("active");
}

// Auto slide
setInterval(() => changeSlide(1), 5000);

// ==================== AUTH FUNCTIONS ====================
async function checkAuthAndLoadName() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            if (!window.location.pathname.includes('login') && 
                !window.location.pathname.includes('register')) {
                window.location.href = 'login.html';
            }
            return null;
        }
        return session.user;
    } catch (e) {
        console.error(e);
        return null;
    }
}

async function logout() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
}

// Make functions available globally
window.logout = logout;
window.changeSlide = changeSlide;
