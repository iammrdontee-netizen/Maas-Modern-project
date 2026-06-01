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
    const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', currentUser.id).single();

    if (!profile || (allowedRoles.length && !allowedRoles.includes(profile.role))) {
        alert("Access denied!");
        window.location.href = 'login.html';
        return null;
    }

    currentProfile = profile;

    document.querySelectorAll('strong, h2, p').forEach(el => {
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
    const els = document.querySelectorAll('p, div, span, small');
    for (let el of els) {
        if (el.textContent.length < 200) {
            el.style.color = isError ? 'red' : 'green';
            el.textContent = msg;
            setTimeout(() => el.textContent = '', 5000);
            break;
        }
    }
}

// ==================== ORIGINAL HELPER FUNCTIONS ====================
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

window.showStudentTab = function(tab) {
    const results = document.getElementById('resultsContent');
    const notes = document.getElementById('notesContent');
    if (!results || !notes) return;
    if (tab === 'results') {
        results.style.display = 'block';
        notes.style.display = 'none';
    } else if (tab === 'notes') {
        results.style.display = 'none';
        notes.style.display = 'block';
        loadNotes();
    }
};

// ==================== GALLERY ====================
let slideIndex = 0;
window.changeSlide = function(n) {
    const images = document.querySelectorAll('img');
    if (images.length === 0) return;
    slideIndex = (slideIndex + n + images.length) % images.length;
    images.forEach((img, i) => img.style.display = (i === slideIndex) ? 'block' : 'none');
};

// ==================== REGISTER BUTTON - VERY STRONG FIX ====================
function setupRegisterForm() {
    // Find form and button more reliably
    const form = document.querySelector('form') || document.getElementById('registerForm');
    if (!form) return;

    let button = form.querySelector('button') || form.querySelector('input[type="submit"]') || document.querySelector('#registerBtn');

    // Visual fix for fading
    if (button) {
        button.style.opacity = '1';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        button.style.cursor = 'pointer';
        button.style.padding = '14px 32px';
        button.style.fontSize = '16px';
        button.style.fontWeight = 'bold';
        button.style.border = 'none';
        button.style.borderRadius = '6px';
    }

    // Main registration function
    const registerUser = async () => {
        const fullName = document.getElementById('fullName')?.value?.trim();
        const email = document.getElementById('email')?.value?.trim();
        const password = document.getElementById('password')?.value?.trim();
        const role = document.getElementById('role')?.value;
        const schoolSection = document.getElementById('schoolSection')?.value || null;

        if (!fullName || !email || !password || !role) {
            showMessage("Please fill all required fields", true);
            return;
        }

        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email, 
                password,
                options: { data: { full_name: fullName } }
            });

            if (error) throw error;

            const { error: profileError } = await supabaseClient.from('profiles').insert({
                id: data.user.id,
                full_name: fullName,
                role: role,
                school_section: schoolSection,
                created_at: new Date().toISOString()
            });

            if (profileError) throw profileError;

            showMessage("✅ Registration Successful! Redirecting...", false);
            setTimeout(() => window.location.href = 'login.html', 2000);
        } catch (err) {
            console.error(err);
            showMessage("❌ " + (err.message || "Registration failed"), true);
        }
    };

    // Attach to form submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await registerUser();
    });

    // Backup direct click on button
    if (button) {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            await registerUser();
        });
    }
}

// ==================== NOTES & DASHBOARDS ====================
async function loadNotes() {
    const container = document.getElementById('notesContainer');
    if (!container) return;
    // ... (same as previous versions)
    try {
        const { data, error } = await supabaseClient.from('notes').select('*').order('created_at', { ascending: false });
        container.innerHTML = data?.length ? data.map(note => `
            <div style="border:1px solid #ddd;padding:15px;margin:10px 0;border-radius:8px;">
                <h4>${note.title}</h4>
                <p><strong>Subject:</strong> ${note.subject} | <strong>Teacher:</strong> ${note.teacher_name}</p>
                <button onclick="downloadNote('\( {note.file_url}', ' \){note.title}')" style="background:#2196F3;color:white;padding:10px 18px;border:none;border-radius:5px;cursor:pointer;">📥 Download</button>
            </div>
        `).join('') : '<p>No notes available yet.</p>';
    } catch (e) {
        container.innerHTML = '<p style="color:red">Failed to load notes</p>';
    }
}

window.downloadNote = async function(fileUrl, title) {
    try {
        const res = await fetch(fileUrl);
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = title + '.pdf';
        a.click();
    } catch {
        alert("Download failed");
    }
};

// (Add your loadStudentResults, loadStudentsByStream, etc. here - same as before)

async function loadStudentResults() {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;
    const { data } = await supabaseClient.from('results').select('*').eq('student_id', currentUser.id);
    tbody.innerHTML = data?.length 
        ? data.map(r => `<tr><td>\( {r.subject}</td><td> \){r.score}</td><td>\( {r.grade}</td><td> \){r.term}</td></tr>`).join('')
        : `<tr><td colspan="4">No results yet</td></tr>`;
}

// ... other dashboard functions ...

// ==================== MAIN LOGIC ====================
document.addEventListener('DOMContentLoaded', async () => {
    setupRegisterForm();

    if (document.title.toLowerCase().includes('student')) {
        await checkAuth(['student']);
        loadStudentResults();
    }

    if (document.title.toLowerCase().includes('teacher')) {
        await checkAuth(['teacher']);
        loadStudentsByStream();
    }

    if (document.title.toLowerCase().includes('admin')) {
        await checkAuth(['admin']);
        loadAllUsers();
        loadAllStudentResults();
    }

    // Logout handlers
    document.querySelectorAll('a, button').forEach(el => {
        if (el.textContent.toLowerCase().includes('logout')) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
    });

    console.log("✅ Maas Modern App - Button Should Now Work");
});
