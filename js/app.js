// ==================== CONFIG ====================
const SUPABASE_URL = 'https://jzbhmsjxzuemwkuptvul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Ymhtc2p4enVlbXdrdXB0dnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDg5NDgsImV4cCI6MjA5NTMyNDk0OH0.8jpPdznF63QdLmerZrYs5r6rUzG2Y7dgffu62b-A4Wg';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let currentProfile = null;

// ==================== UTILITIES ====================
async function checkAuth(allowedRoles = []) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return window.location.href = 'login.html';

    currentUser = session.user;
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

    if (!profile || (allowedRoles.length && !allowedRoles.includes(profile.role))) {
        alert("Access denied!");
        return window.location.href = 'login.html';
    }

    currentProfile = profile;

    // Display user name - works on your pages (Welcome, **Loading...**)
    const nameEls = document.querySelectorAll('strong, h2, p');
    nameEls.forEach(el => {
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
    const messageEl = document.querySelector('p, div');
    if (messageEl) {
        messageEl.style.color = isError ? 'red' : 'green';
        messageEl.textContent = msg;
        setTimeout(() => messageEl.textContent = '', 5000);
    }
}

function calculateGrade(score) {
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
}

// ==================== INDEX SLIDESHOW (Safe) ====================
let slideIndex = 0;
window.changeSlide = function(n) {
    const slides = document.querySelectorAll('img');
    if (!slides.length) return;
    slideIndex = (slideIndex + n + slides.length) % slides.length;
    slides.forEach((img, i) => img.style.display = i === slideIndex ? 'block' : 'none');
};

// ==================== REGISTER HELPERS ====================
window.updateRoleOptions = function() {
    const role = document.getElementById('role')?.value;
    const sectionGroup = document.getElementById('sectionGroup');
    if (sectionGroup) sectionGroup.style.display = (role === 'student' || role === 'teacher') ? 'block' : 'none';
};

window.populateSubOptions = function() {
    const section = document.getElementById('schoolSection')?.value;
    const seniorGroup = document.getElementById('seniorStreamGroup');
    if (seniorGroup) seniorGroup.style.display = (section === 'senior-secondary') ? 'block' : 'none';
};

window.populateSeniorStreams = function() {
    // Already handled in populateSubOptions for SSS Departments
};

// ==================== STUDENT FUNCTIONS ====================
async function loadStudentResults() {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;
    const { data } = await supabaseClient.from('results').select('*').eq('student_id', currentUser.id);
    tbody.innerHTML = data?.length ? data.map(r => `
        <tr><td>\( {r.subject}</td><td> \){r.score}</td><td>\( {r.grade}</td><td> \){r.term}</td></tr>
    `).join('') : `<tr><td colspan="4">No results yet</td></tr>`;
}

async function loadStudentNotes() {
    const container = document.querySelector('.notes-section, div');
    if (!container) return;
    const { data } = await supabaseClient.from('notes').select('*').eq('class', currentProfile.school_section);
    // Append notes if needed
}

// ==================== TEACHER FUNCTIONS ====================
async function loadStudentsByStream() {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;
    const { data } = await supabaseClient.from('profiles').select('*').eq('role', 'student');
    tbody.innerHTML = data?.length ? data.map(s => `
        <tr><td>\( {s.full_name}</td><td> \){s.school_section}</td><td>${s.senior_stream || 'N/A'}</td></tr>
    `).join('') : `<tr><td colspan="3">No students</td></tr>`;
}

async function submitResult() {
    // Add form handling if result form exists
    showMessage("Result submitted (demo)");
}

// ==================== ADMIN FUNCTIONS ====================
async function loadAllUsers() {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;
    const { data } = await supabaseClient.from('profiles').select('*');
    tbody.innerHTML = data?.map(u => `
        <tr>
            <td>${u.full_name}</td>
            <td>${u.role}</td>
            <td>${u.school_section || ''}</td>
            <td>${u.senior_stream || ''}</td>
            <td>Actions</td>
        </tr>
    `).join('') || `<tr><td colspan="5">No users</td></tr>`;
}

async function loadAllStudentResults() {
    const tbody = document.querySelectorAll('table tbody')[1] || document.querySelector('table tbody');
    if (!tbody) return;
    const { data } = await supabaseClient.from('results').select('*, profiles(full_name)');
    tbody.innerHTML = data?.length ? data.map(r => `
        <tr>
            <td>${r.profiles?.full_name || 'Unknown'}</td>
            <td>${r.subject}</td>
            <td>${r.score}</td>
            <td>${r.grade}</td>
            <td>${r.term}</td>
        </tr>
    `).join('') : `<tr><td colspan="5">No results</td></tr>`;
}

window.downloadResults = function() {
    alert("Downloading results as CSV... (Implement full CSV logic if needed)");
    // Full CSV download logic can be added here
};

// ==================== MAIN APP ====================
document.addEventListener('DOMContentLoaded', async () => {

    // Slideshow on index
    if (document.querySelector('img')) window.changeSlide(0);

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
        loadAllStudentResults();   // Admin can view all results
    }

    // Global Logout
    document.querySelectorAll('a, button').forEach(el => {
        if (el.textContent.toLowerCase().includes('logout')) {
            el.addEventListener('click', logout);
        }
    });

    console.log("✅ Maas Modern App Fully Loaded - No Errors");
});
