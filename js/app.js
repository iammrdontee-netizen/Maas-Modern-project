// ==================== CONFIG ====================
const SUPABASE_URL = 'https://jzbhmsjxzuemwkuptvul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Ymhtc2p4enVlbXdrdXB0dnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDg5NDgsImV4cCI6MjA5NTMyNDk0OH0.8jpPdznF63QdLmerZrYs5r6rUzG2Y7dgffu62b-A4Wg';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let currentProfile = null;

// ==================== UTILITIES ====================
async function checkAuth(allowedRoles = []) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return null;
    }

    currentUser = session.user;
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

    if (!profile || (allowedRoles.length && !allowedRoles.includes(profile.role))) {
        alert("Access denied!");
        window.location.href = 'login.html';
        return null;
    }

    currentProfile = profile;

    // Display name safely
    const welcomeEls = document.querySelectorAll('strong, h2, p');
    welcomeEls.forEach(el => {
        if (el.textContent.includes('Loading') || el.textContent.includes('Welcome')) {
            el.innerHTML = `Welcome, <strong>${profile.full_name || 'User'}</strong>`;
        }
    });

    return profile;
}

async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
}

function showMessage(msg, isError = false) {
    const els = document.querySelectorAll('p, div');
    for (let el of els) {
        if (el.textContent.length < 100) {
            el.style.color = isError ? 'red' : 'green';
            el.textContent = msg;
            setTimeout(() => el.textContent = '', 5000);
            break;
        }
    }
}

function calculateGrade(score) {
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
}

// ==================== INDEX GALLERY (Safe - doesn't break images) ====================
let slideIndex = 0;
window.changeSlide = function(n) {
    const images = document.querySelectorAll('img');
    if (images.length === 0) return;
    slideIndex = (slideIndex + n + images.length) % images.length;
    images.forEach((img, i) => {
        img.style.display = (i === slideIndex) ? 'block' : 'none';
    });
};

// ==================== REGISTER PAGE (Fixed Streams/Dropdowns) ====================
window.updateRoleOptions = function() {
    const role = document.getElementById('role')?.value;
    const sectionGroup = document.getElementById('sectionGroup');
    if (sectionGroup) sectionGroup.style.display = (role === 'student' || role === 'teacher') ? 'block' : 'none';
};

window.populateSubOptions = function() {
    const section = document.getElementById('schoolSection')?.value;
    const secondaryGroup = document.getElementById('secondarySubGroup');
    const seniorGroup = document.getElementById('seniorStreamGroup');
    if (secondaryGroup) secondaryGroup.style.display = (section === 'junior-secondary' || section === 'senior-secondary') ? 'block' : 'none';
    if (seniorGroup) seniorGroup.style.display = 'none';
};

window.populateSeniorStreams = function() {
    const level = document.getElementById('secondaryLevel')?.value;
    const seniorGroup = document.getElementById('seniorStreamGroup');
    if (seniorGroup) seniorGroup.style.display = (level === 'senior') ? 'block' : 'none';
};

// ==================== STUDENT DASHBOARD ====================
async function loadStudentResults() {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;
    const { data } = await supabaseClient.from('results').select('*').eq('student_id', currentUser.id);
    tbody.innerHTML = data?.length 
        ? data.map(r => `<tr><td>\( {r.subject}</td><td> \){r.score}</td><td>\( {r.grade}</td><td> \){r.term}</td></tr>`).join('')
        : `<tr><td colspan="4">No results yet</td></tr>`;
}

// ==================== TEACHER DASHBOARD ====================
async function loadStudentsByStream() {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;
    const { data } = await supabaseClient.from('profiles').select('*').eq('role', 'student');
    tbody.innerHTML = data?.length 
        ? data.map(s => `<tr><td>\( {s.full_name}</td><td> \){s.school_section}</td><td>${s.senior_stream || 'N/A'}</td></tr>`).join('')
        : `<tr><td colspan="3">No students found</td></tr>`;
}

// ==================== ADMIN DASHBOARD ====================
async function loadAllUsers() {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;
    const { data } = await supabaseClient.from('profiles').select('*');
    tbody.innerHTML = data?.length 
        ? data.map(u => `<tr><td>\( {u.full_name}</td><td> \){u.role}</td><td>\( {u.school_section}</td><td> \){u.senior_stream || ''}</td><td>Actions</td></tr>`).join('')
        : `<tr><td colspan="5">No users</td></tr>`;
}

async function loadAllStudentResults() {
    const tbodies = document.querySelectorAll('table tbody');
    const tbody = tbodies.length > 1 ? tbodies[1] : tbodies[0];
    if (!tbody) return;
    const { data } = await supabaseClient.from('results').select('*, profiles(full_name)');
    tbody.innerHTML = data?.length 
        ? data.map(r => `<tr><td>\( {r.profiles?.full_name}</td><td> \){r.subject}</td><td>\( {r.score}</td><td> \){r.grade}</td><td>${r.term}</td></tr>`).join('')
        : `<tr><td colspan="5">No results</td></tr>`;
}

// ==================== MAIN LOGIC ====================
document.addEventListener('DOMContentLoaded', async () => {

    // Fix Gallery on Index
    if (document.querySelector('img')) {
        window.changeSlide(0);
    }

    // Register Page
    if (document.getElementById('registerForm') || document.title.toLowerCase().includes('register')) {
        // Your form handlers remain active
    }

    // Login Page
    if (document.getElementById('loginForm') || document.title.toLowerCase().includes('login')) {
        const form = document.getElementById('loginForm') || document.querySelector('form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email')?.value || document.querySelector('input[type="email"]').value;
                const password = document.getElementById('password')?.value || document.querySelector('input[type="password"]').value;

                try {
                    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
                    if (error) throw error;

                    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', data.user.id).single();

                    if (profile?.role === 'student') window.location.href = 'student.html';
                    else if (profile?.role === 'teacher') window.location.href = 'teacher.html';
                    else if (profile?.role === 'admin') window.location.href = 'admin.html';
                    else window.location.href = 'login.html';
                } catch (err) {
                    showMessage(err.message, true);
                }
            });
        }
    }

    // Student Dashboard
    if (document.title.toLowerCase().includes('student')) {
        await checkAuth(['student']);
        loadStudentResults();
    }

    // Teacher Dashboard
    if (document.title.toLowerCase().includes('teacher')) {
        await checkAuth(['teacher']);
        loadStudentsByStream();
    }

    // Admin Dashboard
    if (document.title.toLowerCase().includes('admin')) {
        await checkAuth(['admin']);
        loadAllUsers();
        loadAllStudentResults();
    }

    // Logout Buttons
    document.querySelectorAll('a, button').forEach(el => {
        if (el.textContent.toLowerCase().includes('logout')) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
    });

    console.log("✅ Maas Modern App Loaded Successfully (All Fixed)");
});
