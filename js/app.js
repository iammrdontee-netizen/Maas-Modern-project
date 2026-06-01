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

// ==================== INDEX GALLERY ====================
let slideIndex = 0;
window.changeSlide = function(n) {
    const images = document.querySelectorAll('img');
    if (images.length === 0) return;
    slideIndex = (slideIndex + n + images.length) % images.length;
    images.forEach((img, i) => {
        img.style.display = (i === slideIndex) ? 'block' : 'none';
    });
};

// ==================== REGISTER PAGE (Fixed + Reduced Security) ====================
function setupRegisterForm() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    const registerBtn = document.getElementById('registerBtn') || form.querySelector('button[type="submit"]');
    
    // Fix fading button
    if (registerBtn) {
        registerBtn.style.opacity = '1';
        registerBtn.style.backgroundColor = '#4CAF50';
        registerBtn.style.color = 'white';
        registerBtn.style.cursor = 'pointer';
        registerBtn.style.border = 'none';
        registerBtn.style.padding = '12px 24px';
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullName = document.getElementById('fullName')?.value;
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;
        const role = document.getElementById('role')?.value;
        const schoolSection = document.getElementById('schoolSection')?.value;
        const secondaryLevel = document.getElementById('secondaryLevel')?.value;
        const seniorStream = document.getElementById('seniorStream')?.value;

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

            const { error: profileError } = await supabaseClient
                .from('profiles')
                .insert({
                    id: data.user.id,
                    full_name: fullName,
                    role: role,
                    school_section: schoolSection || null,
                    secondary_level: secondaryLevel || null,
                    senior_stream: seniorStream || null,
                    created_at: new Date().toISOString()
                });

            if (profileError) throw profileError;

            showMessage("Registration successful! Redirecting to login...");
            setTimeout(() => window.location.href = 'login.html', 2000);

        } catch (err) {
            console.error(err);
            showMessage(err.message || "Registration failed. Try again.", true);
        }
    });
}

// ==================== NOTES FUNCTIONALITY ====================
async function loadNotes() {
    const notesContainer = document.getElementById('notesContainer');
    if (!notesContainer) return;

    try {
        const { data, error } = await supabaseClient
            .from('notes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            notesContainer.innerHTML = `<p>No notes available yet.</p>`;
            return;
        }

        notesContainer.innerHTML = data.map(note => `
            <div class="note-card" style="border:1px solid #ddd; padding:15px; margin:10px 0; border-radius:8px; background:#f9f9f9;">
                <h4>${note.title}</h4>
                <p><strong>Subject:</strong> ${note.subject} | <strong>By:</strong> ${note.teacher_name}</p>
                <p>${note.description || 'No description provided.'}</p>
                <button onclick="downloadNote('\( {note.file_url}', ' \){note.title}')" 
                        style="background:#2196F3; color:white; padding:8px 16px; border:none; border-radius:4px; cursor:pointer;">
                    📥 Download Note
                </button>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
        notesContainer.innerHTML = `<p style="color:red">Failed to load notes</p>`;
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

// For Teachers - Upload Note
window.uploadNote = async function() {
    const title = document.getElementById('noteTitle')?.value;
    const subject = document.getElementById('noteSubject')?.value;
    const description = document.getElementById('noteDescription')?.value || '';
    const fileInput = document.getElementById('noteFile');

    if (!title || !subject || !fileInput?.files[0]) {
        alert("Please fill title, subject and select a file");
        return;
    }

    const file = fileInput.files[0];
    const fileName = `\( {Date.now()}- \){file.name}`;

    try {
        const { data: fileData, error: uploadError } = await supabaseClient.storage
            .from('notes')
            .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        const publicUrl = supabaseClient.storage.from('notes').getPublicUrl(fileName).data.publicUrl;

        const { error: dbError } = await supabaseClient
            .from('notes')
            .insert({
                title,
                subject,
                description,
                teacher_name: currentProfile.full_name,
                file_url: publicUrl,
                uploaded_by: currentUser.id
            });

        if (dbError) throw dbError;

        showMessage("Note uploaded successfully!");
        loadNotes(); // Refresh list

    } catch (err) {
        console.error(err);
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

// ==================== MAIN LOGIC ====================
document.addEventListener('DOMContentLoaded', async () => {

    // Fix Gallery on Index
    if (document.querySelector('img')) {
        window.changeSlide(0);
    }

    // Setup Register Page
    setupRegisterForm();

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
        loadNotes();                    // Added Notes
    }

    // Teacher Dashboard
    if (document.title.toLowerCase().includes('teacher')) {
        await checkAuth(['teacher']);
        loadStudentsByStream();
        // loadNotes() can be added if you want teachers to see notes too
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

    console.log("✅ Maas Modern App Loaded Successfully (All Fixed & Notes Added)");
});
