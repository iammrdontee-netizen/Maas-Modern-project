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
    const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', currentUser.id).single();

    if (!profile || (allowedRoles.length && !allowedRoles.includes(profile.role))) {
        alert("Access denied!");
        return window.location.href = 'login.html';
    }

    currentProfile = profile;
    
    // Display user name (works on all dashboards)
    const nameEl = document.getElementById('userName') || document.querySelector('strong, h2');
    if (nameEl) nameEl.textContent = profile.full_name || 'Admin/User';

    return profile;
}

async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
}

function showMessage(id, msg, isError = false) {
    const el = document.getElementById(id) || document.querySelector('.message, p');
    if (el) {
        el.style.color = isError ? 'red' : 'green';
        el.textContent = msg;
        setTimeout(() => el.textContent = '', 5000);
    }
}

function calculateGrade(score) {
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
}

// ==================== INDEX SLIDESHOW ====================
let slideIndex = 0;
window.changeSlide = function(n) {
    const slides = document.querySelectorAll('img, .slide');
    if (!slides.length) return;
    slideIndex = (slideIndex + n + slides.length) % slides.length;
    slides.forEach((s, i) => s.style.display = (i === slideIndex) ? 'block' : 'none');
};
setInterval(() => window.changeSlide(1), 4000);

// ==================== REGISTER HELPERS (unchanged) ====================
window.updateRoleOptions = function() { /* your existing */ };
window.populateSubOptions = function() { /* your existing */ };
window.populateSeniorStreams = function() { /* your existing */ };

// ==================== STUDENT FUNCTIONS ====================
async function loadStudentResults() {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;
    const { data } = await supabaseClient.from('results').select('*').eq('student_id', currentUser.id);
    tbody.innerHTML = data?.length ? data.map(r => `
        <tr><td>\( {r.subject}</td><td> \){r.score}</td><td>\( {r.grade}</td><td> \){r.term}</td></tr>
    `).join('') : `<tr><td colspan="4">No results yet</td></tr>`;
}

// ==================== TEACHER FUNCTIONS ====================
async function loadStudentsByStream() { /* your existing */ }

async function submitResult() { /* your existing with grade calculation */ }

// ==================== ADMIN FUNCTIONS (Enhanced) ====================
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
            <td><button onclick="deleteUser('${u.id}')">Remove</button></td>
        </tr>
    `).join('') || '<tr><td colspan="5">No users found</td></tr>';
}

async function loadAllStudentResults() {
    const tbody = document.getElementById('resultsTableBody') || document.querySelectorAll('table tbody')[1];
    if (!tbody) return;
    
    const { data } = await supabaseClient
        .from('results')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false });

    tbody.innerHTML = data?.length ? data.map(r => `
        <tr>
            <td>${r.profiles?.full_name || 'Unknown'}</td>
            <td>${r.subject}</td>
            <td>${r.score}</td>
            <td>${r.grade}</td>
            <td>${r.term}</td>
        </tr>
    `).join('') : `<tr><td colspan="5">No results found</td></tr>`;
}

// Download results as CSV
window.downloadResults = async function() {
    const { data } = await supabaseClient.from('results').select('*, profiles(full_name)');
    if (!data || !data.length) return alert("No results to download");

    let csv = "Student,Subject,Score,Grade,Term\n";
    data.forEach(r => {
        csv += `"\( {r.profiles?.full_name || ''}"," \){r.subject}",\( {r.score}," \){r.grade}","${r.term}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_results.csv';
    a.click();
};

// ==================== MAIN APP ====================
document.addEventListener('DOMContentLoaded', async () => {

    if (document.querySelector('img, .slide')) window.changeSlide(0);

    // Student Dashboard
    if (document.querySelector('#studentDashboard, .student-page')) {
        await checkAuth(['student']);
        loadStudentResults();
    }

    // Teacher Dashboard
    if (document.querySelector('#teacherDashboard, .teacher-page')) {
        await checkAuth(['teacher']);
        // ... existing teacher functions
    }

    // Admin Dashboard
    if (document.querySelector('#adminDashboard, .admin-page')) {
        await checkAuth(['admin']);
        loadAllUsers();
        loadAllStudentResults();           // ← Admin can view all student results
    }

    // Global Logout
    document.querySelectorAll('a, button').forEach(el => {
        if (el.textContent.toLowerCase().includes('logout')) {
            el.addEventListener('click', logout);
        }
    });

    console.log("✅ Maas Modern App Fully Loaded");
});
