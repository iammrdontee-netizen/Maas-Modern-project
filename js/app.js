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
    const els = document.querySelectorAll('p, div, span');
    for (let el of els) {
        if (el.textContent.length < 150) {
            el.style.color = isError ? 'red' : 'green';
            el.textContent = msg;
            setTimeout(() => { if (el) el.textContent = ''; }, 5000);
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

// ==================== GALLERY ====================
let slideIndex = 0;
window.changeSlide = function(n) {
    const images = document.querySelectorAll('img');
    if (images.length === 0) return;
    slideIndex = (slideIndex + n + images.length) % images.length;
    images.forEach((img, i) => {
        img.style.display = (i === slideIndex) ? 'block' : 'none';
    });
};

// ==================== REGISTER PAGE (Fixed Button + Reduced Security) ====================
function setupRegisterForm() {
    const form = document.getElementById('registerForm') || document.querySelector('form');
    if (!form) return;

    const registerBtn = form.querySelector('button, input[type="submit"]');
    if (registerBtn) {
        registerBtn.style.opacity = '1';
        registerBtn.style.backgroundColor = '#4CAF50';
        registerBtn.style.color = 'white';
        registerBtn.style.cursor = 'pointer';
        registerBtn.style.border = 'none';
        registerBtn.style.padding = '12px 30px';
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullName = document.getElementById('fullName')?.value || document.querySelector('input[placeholder*="Name"]')?.value;
        const email = document.getElementById('email')?.value || document.querySelector('input[type="email"]')?.value;
        const password = document.getElementById('password')?.value || document.querySelector('input[type="password"]')?.value;
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

            showMessage("Registration successful! Redirecting to login...", false);
            setTimeout(() => window.location.href = 'login.html', 2000);
        } catch (err) {
            console.error(err);
            showMessage(err.message || "Registration failed", true);
        }
    });
}

// ==================== NOTES FUNCTIONALITY ====================
async function loadNotes() {
    const container = document.getElementById('notesContainer');
    if (!container) return;

    try {
        const { data, error } = await supabaseClient
            .from('notes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        container.innerHTML = data?.length 
            ? data.map(note => `
                <div class="note-card" style="border:1px solid #ddd; padding:15px; margin:10px 0; border-radius:8px;">
                    <h4>${note.title}</h4>
                    <p><strong>Subject:</strong> ${note.subject} | <strong>Teacher:</strong> ${note.teacher_name}</p>
                    <button onclick="downloadNote('\( {note.file_url}', ' \){note.title}')" 
                            style="background:#2196F3; color:white; padding:10px 18px; border:none; border-radius:5px; cursor:pointer;">
                        📥 Download
                    </button>
                </div>
            `).join('')
            : `<p>No notes available yet.</p>`;
    } catch (err) {
        container.innerHTML = `<p style="color:red">Failed to load notes</p>`;
    }
}

window.downloadNote = async function(fileUrl, title) {
    try {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = title.replace(/[^a-z0-9]/gi, '_') + '.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        alert("Download failed. File may not be available.");
    }
};

window.uploadNote = async function() {
    const title = document.getElementById('noteTitle')?.value;
    const subject = document.getElementById('noteSubject')?.value;
    const fileInput = document.getElementById('noteFile');

    if (!title || !subject || !fileInput?.files[0]) {
        alert("Please fill all fields and select a file");
        return;
    }

    const file = fileInput.files[0];
    const fileName = `\( {Date.now()}- \){file.name}`;

    try {
        const { error: uploadError } = await supabaseClient.storage
            .from('notes')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const publicUrl = supabaseClient.storage.from('notes').getPublicUrl(fileName).data.publicUrl;

        const { error: dbError } = await supabaseClient.from('notes').insert({
            title,
            subject,
            teacher_name: currentProfile.full_name,
            file_url: publicUrl,
            uploaded_by: currentUser.id
        });

        if (dbError) throw dbError;

        showMessage("Note uploaded successfully!");
        loadNotes();
    } catch (err) {
        showMessage("Upload failed: " + err.message, true);
    }
};

// ==================== DASHBOARD FUNCTIONS ====================
async function loadStudentResults() {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;
    const { data } = await supabaseClient.from('results').select('*').eq('student_id', currentUser.id);
    tbody.innerHTML = data?.length 
        ? data.map(r => `<tr><td>\( {r.subject}</td><td> \){r.score}</td><td>\( {r.grade}</td><td> \){r.term}</td></tr>`).join('')
        : `<tr><td colspan="4">No results yet</td></tr>`;
}

async function loadStudentsByStream() {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;
    const { data } = await supabaseClient.from('profiles').select('*').eq('role', 'student');
    tbody.innerHTML = data?.length 
        ? data.map(s => `<tr><td>\( {s.full_name}</td><td> \){s.school_section}</td><td>${s.senior_stream || 'N/A'}</td></tr>`).join('')
        : `<tr><td colspan="3">No students found</td></tr>`;
}

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

// ==================== STUDENT TABS ====================
function setupStudentTabs() {
    const resultsTab = document.getElementById('resultsTab');
    const notesTab = document.getElementById('notesTab');
    const resultsContent = document.getElementById('resultsContent');
    const notesContent = document.getElementById('notesContent');

    if (resultsTab && notesTab) {
        resultsTab.addEventListener('click', () => {
            resultsTab.classList.add('active');
            notesTab.classList.remove('active');
            if (resultsContent) resultsContent.style.display = 'block';
            if (notesContent) notesContent.style.display = 'none';
        });

        notesTab.addEventListener('click', () => {
            notesTab.classList.add('active');
            resultsTab.classList.remove('active');
            if (resultsContent) resultsContent.style.display = 'none';
            if (notesContent) notesContent.style.display = 'block';
            loadNotes();
        });
    }
}

// ==================== MAIN LOGIC ====================
document.addEventListener('DOMContentLoaded', async () => {

    if (document.querySelector('img')) {
        window.changeSlide(0);
    }

    setupRegisterForm();
    setupStudentTabs();

    // Login Page
    if (document.title.toLowerCase().includes('login')) {
        const form = document.getElementById('loginForm') || document.querySelector('form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email')?.value || document.querySelector('input[type="email"]')?.value;
                const password = document.getElementById('password')?.value || document.querySelector('input[type="password"]')?.value;

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
        loadNotes();   // Load notes on page load
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

    // Logout
    document.querySelectorAll('a, button').forEach(el => {
        if (el.textContent.toLowerCase().includes('logout')) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
    });

    console.log("✅ Maas Modern App Loaded Successfully");
});
