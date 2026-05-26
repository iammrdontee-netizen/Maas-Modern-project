// ==================== SUPABASE SETUP (FIXED) ====================
const SUPABASE_URL = 'https://jzbhmsjxzuemwkuptvul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Ymhtc2p4enVlbXdrdXB0dnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDg5NDgsImV4cCI6MjA5NTMyNDk0OH0.8jpPdznF63QdLmerZrYs5r6rUzG2Y7dgffu62b-A4Wg';

const { createClient } = supabase;  // Correct CDN usage
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== GALLERY SLIDESHOW ====================
let currentSlide = 0;

function changeSlide(n) {
    const slides = document.getElementsByClassName("slide");
    if (slides.length === 0) return;

    currentSlide += n;
    if (currentSlide >= slides.length) currentSlide = 0;
    if (currentSlide < 0) currentSlide = slides.length - 1;

    for (let slide of slides) {
        slide.classList.remove("active");
    }
    slides[currentSlide].classList.add("active");
}

// Auto slide
setInterval(() => changeSlide(1), 5000);

// ==================== AUTH FUNCTIONS ====================
async function checkAuthAndLoadName() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return null;
    }
    return session.user;
}

async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
}

// ==================== REGISTRATION ====================
if (document.getElementById('registerForm')) {
    const roleSelect = document.getElementById('role');
    const sectionSelect = document.getElementById('schoolSection');

    if (roleSelect) roleSelect.addEventListener('change', updateRoleOptions);
    if (sectionSelect) sectionSelect.addEventListener('change', populateClassOptions);

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fullname = document.getElementById('fullName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const role = document.getElementById('role').value;
        const schoolSection = document.getElementById('schoolSection').value;
        const classLevel = document.getElementById('classLevel') ? document.getElementById('classLevel').value : null;
        
        const messageEl = document.getElementById('registerMessage');

        try {
            const { data, error } = await supabaseClient.auth.signUp({ email, password });
            if (error) throw error;

            await supabaseClient.from('profiles').insert({
                id: data.user.id,
                full_name: fullname,
                role: role,
                school_section: schoolSection,
                class_level: classLevel,
                email: email,
                status: 'active'
            });

            messageEl.textContent = 'Registration successful! Redirecting...';
            messageEl.style.color = "green";
            setTimeout(() => window.location.href = "login.html", 2000);
        } catch (error) {
            messageEl.textContent = error.message;
            messageEl.style.color = "red";
        }
    });
}

function updateRoleOptions() {
    const role = document.getElementById('role').value;
    const sectionGroup = document.getElementById('sectionGroup');
    const classGroup = document.getElementById('classGroup');
    
    if (sectionGroup) sectionGroup.style.display = role ? 'block' : 'none';
    if (classGroup) classGroup.style.display = (role === 'student') ? 'block' : 'none';
}

function populateClassOptions() {
    const section = document.getElementById('schoolSection').value;
    const classSelect = document.getElementById('classLevel');
    if (!classSelect) return;
    
    classSelect.innerHTML = '<option value="">Select Class</option>';

    if (section === 'primary') {
        ["Pre-sch", "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5"].forEach(c => 
            classSelect.appendChild(new Option(c, c))
        );
    } else if (section === 'secondary') {
        ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"].forEach(c => 
            classSelect.appendChild(new Option(c, c))
        );
    }
}

// ==================== LOGIN ====================
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const messageEl = document.getElementById('loginMessage');

        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;

            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();

            if (profile?.role === 'student') window.location.href = 'student.html';
            else if (profile?.role === 'teacher') window.location.href = 'teacher.html';
            else if (profile?.role === 'admin') window.location.href = 'admin.html';
            else window.location.href = 'index.html';
        } catch (error) {
            messageEl.textContent = error.message || 'Login failed';
            messageEl.style.color = "red";
        }
    });
}

// Make functions global
window.logout = logout;
window.updateRoleOptions = updateRoleOptions;
window.populateClassOptions = populateClassOptions;
window.changeSlide = changeSlide;
