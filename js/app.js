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

    console.log("🔍 Checking profile for user:", currentUser.id);

    // Try both ways (filter and eq) for safety
    let { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('full_name, role, school_section')
        .filter('id', 'eq', currentUser.id)
        .single();

    if (error || !profile) {
        // Fallback try with .eq()
        const fallback = await supabaseClient
            .from('profiles')
            .select('full_name, role, school_section')
            .eq('id', currentUser.id)
            .single();
        
        profile = fallback.data;
        error = fallback.error;
    }

    if (profile && document.getElementById('userName')) {
        document.getElementById('userName').textContent = profile.full_name || currentUser.email;
        console.log("✅ Profile loaded:", profile);
    } else {
        console.error("❌ STILL No profile found for user:", currentUser.id);
        console.log("Current user object:", currentUser);
    }

    return profile;
}
// ==================== REGISTER SCRIPT ====================
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const role = document.getElementById('role').value;
        const messageEl = document.getElementById('registerMessage');

        messageEl.textContent = "Creating account...";
        messageEl.style.color = "blue";

        try {
            // Step 1: Create Auth User
            const { data, error: authError } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName }
                }
            });

            if (authError) throw authError;

            if (!data.user) throw new Error("Failed to create user");

            console.log("✅ Auth user created:", data.user.id);

            // Step 2: Insert Profile Row
            const { error: profileError } = await supabaseClient
                .from('profiles')
                .insert({
                    id: data.user.id,
                    full_name: fullName,
                    role: role,
                    school_section: 'General'
                });

            if (profileError) {
                console.error("❌ Profile insert failed:", profileError);
                messageEl.style.color = "orange";
                messageEl.textContent = "Account created but profile failed. Please contact admin.";
            } else {
                console.log("✅ Profile inserted successfully!");
                messageEl.style.color = "green";
                messageEl.textContent = "Registration successful! Redirecting to login...";
            }

            // Redirect to login after 2.5 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2500);

        } catch (error) {
            console.error("Registration error:", error);
            messageEl.style.color = "red";
            messageEl.textContent = error.message || "Registration failed. Try again.";
        }
    });
}
// ==================== LOGIN SCRIPT ====================
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const messageEl = document.getElementById('loginMessage');

        messageEl.textContent = "Logging in...";
        messageEl.style.color = "blue";

        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email, password
            });

            if (error) throw error;

            await new Promise(resolve => setTimeout(resolve, 1500));

            let { data: profile, error: profileError } = await supabaseClient
                .from('profiles')
                .select('role, full_name')
                .filter('id', 'eq', data.user.id)
                .single();

            // Fallback
            if (profileError || !profile) {
                const fallback = await supabaseClient
                    .from('profiles')
                    .select('role, full_name')
                    .eq('id', data.user.id)
                    .single();
                profile = fallback.data;
            }

            console.log("🔍 FINAL LOGIN DEBUG:", { 
                userId: data.user.id, 
                role: profile?.role,
                name: profile?.full_name 
            });

            if (profile?.role === 'teacher') {
                window.location.href = 'teacher.html';
            } else if (profile?.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'student.html';
            }

        } catch (error) {
            console.error("Login error:", error);
            messageEl.style.color = "red";
            messageEl.textContent = error.message || "Login failed.";
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
// ==================== LOGOUT ====================
window.logout = async function() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;

        // Clear local data
        currentUser = null;
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Logout error:", error);
        alert("Logout failed. Please try again.");
    }
};
// Make functions globally accessible
window.logout = logout;
//window.changeSlide = changeSlide;
//window.updateRoleOptions = updateRoleOptions;
//window.populateClassOptions = populateClassOptions;
window.showAdminTab = showAdminTab;
window.loadStudentDashboard = loadStudentDashboard;
window.loadTeacherDashboard = loadTeacherDashboard;
window.loadAdminDashboard = loadAdminDashboard;
