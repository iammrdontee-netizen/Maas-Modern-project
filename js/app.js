// ==================== SUPABASE SETUP ====================
const SUPABASE_URL = 'https://jzbhmsjxzuemwkuptvul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Ymhtc2p4enVlbXdrdXB0dnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDg5NDgsImV4cCI6MjA5NTMyNDk0OH0.8jpPdznF63QdLmerZrYs5r6rUzG2Y7dgffu62b-A4Wg';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== GLOBAL VARIABLES ====================
let currentUser = null;

// ==================== UTILITY FUNCTIONS ====================
async function checkAuthAndLoadName() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return null;
    }
    currentUser = session.user;

    // Load user name
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('full_name, role')
        .eq('id', currentUser.id)
        .single();

    if (profile && document.getElementById('userName')) {
        document.getElementById('userName').textContent = profile.full_name || 'User';
    }
    return profile;
}

async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
}

// ==================== GALLERY SLIDESHOW ====================
let currentSlide = 0;
function changeSlide(n) {
    const slides = document.getElementsByClassName("slide");
    if (slides.length === 0) return;
    
    currentSlide = (currentSlide + n + slides.length) % slides.length;
    Array.from(slides).forEach(slide => slide.classList.remove("active"));
    slides[currentSlide].classList.add("active");
}
setInterval(() => changeSlide(1), 5000);

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
        const classLevel = document.getElementById('classLevel')?.value || null;

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

            messageEl.textContent = 'Registration successful! Please check your email and login.';
            messageEl.style.color = "green";
            setTimeout(() => window.location.href = "login.html", 2500);
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
        ["Pre-sch", "Primary 1","Primary 2","Primary 3","Primary 4","Primary 5"].forEach(c => 
            classSelect.appendChild(new Option(c, c)));
    } else if (section === 'secondary') {
        ["JSS 1","JSS 2","JSS 3","SSS 1","SSS 2","SSS 3"].forEach(c => 
            classSelect.appendChild(new Option(c, c)));
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
            messageEl.textContent = error.message || 'Invalid credentials';
            messageEl.style.color = "red";
        }
    });
}

// ==================== STUDENT PORTAL ====================
async function loadStudentDashboard() {
    await checkAuthAndLoadName();
    loadStudentResults();
    loadStudentNotes();
}

async function loadStudentResults() {
    const tbody = document.getElementById('resultsTableBody');
    if (!tbody) return;

    const { data } = await supabaseClient
        .from('results')
        .select('*')
        .eq('student_id', currentUser.id)
        .order('term', { ascending: false });

    tbody.innerHTML = data && data.length ? data.map(r => `
        <tr>
            <td>${r.subject}</td>
            <td>${r.score}</td>
            <td>${r.grade}</td>
            <td>${r.term}</td>
        </tr>
    `).join('') : '<tr><td colspan="4">No results yet</td></tr>';
}

async function loadStudentNotes() {
    const container = document.getElementById('notesContainer');
    if (!container) return;

    const { data } = await supabaseClient
        .from('notes')
        .select('*')
        .eq('target_class', currentUser?.user_metadata?.class_level || null)
        .order('created_at', { ascending: false });

    container.innerHTML = data && data.length ? data.map(note => `
        <div class="note-card">
            <h4>${note.title}</h4>
            <p>${note.content}</p>
            <small>Posted: ${new Date(note.created_at).toLocaleDateString()}</small>
        </div>
    `).join('') : '<p>No notes available yet.</p>';
}

// ==================== TEACHER PORTAL ====================
async function loadTeacherDashboard() {
    await checkAuthAndLoadName();
    loadMyStudents();
    loadTeacherNotes();
}

async function loadMyStudents() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    const profile = await checkAuthAndLoadName();
    
    const { data } = await supabaseClient
        .from('profiles')
        .select('id, full_name, class_level')
        .eq('role', 'student')
        .eq('school_section', profile.school_section);

    tbody.innerHTML = data && data.length ? data.map(student => `
        <tr>
            <td>${student.full_name}</td>
            <td>${student.class_level || 'N/A'}</td>
            <td><button onclick="viewStudentResults('${student.id}')">View Results</button></td>
        </tr>
    `).join('') : '<tr><td colspan="3">No students found</td></tr>';
}

async function loadTeacherNotes() {
    const container = document.getElementById('teacherNotesContainer');
    if (!container) return;
    // Similar to student notes but for teacher view
    container.innerHTML = '<p>Notes management coming soon...</p>';
}

window.viewStudentResults = async function(studentId) {
    alert("Student results viewer - To be fully implemented with modal");
};

// ==================== ADMIN PORTAL ====================
async function loadAdminDashboard() {
    await checkAuthAndLoadName();
    loadAllUsers();
}

async function loadAllUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    const { data } = await supabaseClient
        .from('profiles')
        .select('id, full_name, email, role, school_section, class_level, status')
        .order('role');

    tbody.innerHTML = data && data.length ? data.map(user => `
        <tr>
            <td>${user.full_name}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>${user.school_section || ''}</td>
            <td>${user.class_level || ''}</td>
            <td>${user.status}</td>
        </tr>
    `).join('') : '<tr><td colspan="6">No users found</td></tr>';
}

// ==================== TAB SWITCHING FOR ADMIN ====================
function showAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
    document.getElementById(tab + 'Tab').style.display = 'block';
    
    if (tab === 'users') loadAllUsers();
    if (tab === 'overview') console.log("Overview tab loaded");
}

// Make functions globally accessible
window.logout = logout;
window.changeSlide = changeSlide;
window.updateRoleOptions = updateRoleOptions;
window.populateClassOptions = populateClassOptions;
window.showAdminTab = showAdminTab;
window.loadStudentDashboard = loadStudentDashboard;
window.loadTeacherDashboard = loadTeacherDashboard;
window.loadAdminDashboard = loadAdminDashboard;
