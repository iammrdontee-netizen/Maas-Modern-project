// ==================== SUPABASE SETUP ====================
const SUPABASE_URL = 'https://jzbhmsjxzuemwkuptvul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Ymhtc2p4enVlbXdrdXB0dnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDg5NDgsImV4cCI6MjA5NTMyNDk0OH0.8jpPdznF63QdLmerZrYs5r6rUzG2Y7dgffu62b-A4Wg';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== GLOBAL VARIABLES ====================
let currentUser = null;

// ==================== UTILITY FUNCTIONS ====================
async function checkAuthAndLoadName() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            window.location.href = 'login.html';
            return;
        }

        currentUser = session.user;

        // Fetch profile
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('full_name')
            .eq('id', currentUser.id)
            .single();

        const nameEl = document.getElementById('userName');
        
        if (nameEl) {
            if (profile && profile.full_name) {
                nameEl.textContent = profile.full_name;
            } else {
                nameEl.textContent = currentUser.email || "User";   // Fallback
            }
        }

        console.log("Profile fetched:", profile); // For debugging

    } catch (error) {
        console.error("Name load error:", error);
        const nameEl = document.getElementById('userName');
        if (nameEl) nameEl.textContent = "Error";
    }
}

// ==================== IMPROVED REGISTRATION WITH VALIDATION + DYNAMIC FILTERING ====================
if (document.getElementById('registerForm')) {
    const registerForm = document.getElementById('registerForm');
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const messageEl = document.getElementById('registerMessage');

    // Validation Helpers
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isStrongPassword(password) {
        return password.length >= 8 &&
               /[A-Z]/.test(password) &&
               /[a-z]/.test(password) &&
               /\d/.test(password) &&
               /[!@#$%^&*(),.?":{}|<>]/.test(password);
    }

    function showFieldError(fieldId, msg) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.style.borderColor = '#e74c3c';
            let errorSpan = document.getElementById(fieldId + 'Error');
            if (!errorSpan) {
                errorSpan = document.createElement('span');
                errorSpan.id = fieldId + 'Error';
                errorSpan.style.fontSize = '0.85rem';
                field.parentNode.appendChild(errorSpan);
            }
            errorSpan.textContent = msg;
            errorSpan.style.color = '#e74c3c';
        }
    }

    function clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) field.style.borderColor = '#27ae60';
        const errorSpan = document.getElementById(fieldId + 'Error');
        if (errorSpan) errorSpan.textContent = '';
    }

    function checkFormValidity() {
        const fullname = document.getElementById('fullName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const role = document.getElementById('role').value;

        const isValid = fullname.length > 0 &&
                       isValidEmail(email) &&
                       isStrongPassword(password) &&
                       role !== '';

        if (submitBtn) submitBtn.disabled = !isValid;
    }

    // Real-time Validation
    const emailField = document.getElementById('regEmail');
    const passwordField = document.getElementById('regPassword');

    if (emailField) {
        emailField.addEventListener('input', () => {
            if (emailField.value.trim() && !isValidEmail(emailField.value)) {
                showFieldError('regEmail', 'Please enter a valid email address');
            } else {
                clearFieldError('regEmail');
            }
            checkFormValidity();
        });
    }

    if (passwordField) {
        passwordField.addEventListener('input', () => {
            if (passwordField.value && !isStrongPassword(passwordField.value)) {
                showFieldError('regPassword', 'Password must be 8+ chars (Upper, lower, number & special)');
            } else {
                clearFieldError('regPassword');
            }
            checkFormValidity();
        });
    }

    ['fullName', 'role'].forEach(id => {
        const field = document.getElementById(id);
        if (field) field.addEventListener('change', checkFormValidity);
    });

    // Dynamic Filtering (Student vs Teacher)
    window.updateRoleOptions = function() {
        const role = document.getElementById('role').value;
        const sectionGroup = document.getElementById('sectionGroup');
        
        if (sectionGroup) {
            sectionGroup.style.display = (role === 'student' || role === 'teacher') ? 'block' : 'none';
        }

        const secondarySubGroup = document.getElementById('secondarySubGroup');
        const seniorStreamGroup = document.getElementById('seniorStreamGroup');
        if (secondarySubGroup) secondarySubGroup.style.display = 'none';
        if (seniorStreamGroup) seniorStreamGroup.style.display = 'none';

        checkFormValidity();
    };

    window.populateSubOptions = function() {
        const role = document.getElementById('role').value;
        const section = document.getElementById('schoolSection').value;
        
        const secondarySubGroup = document.getElementById('secondarySubGroup');
        const seniorStreamGroup = document.getElementById('seniorStreamGroup');

        if (!secondarySubGroup || !seniorStreamGroup) return;

        seniorStreamGroup.style.display = 'none';

        if (role === 'student') {
            if (section === 'pre-school' || section === 'primary') {
                secondarySubGroup.style.display = 'none';
            } else if (section === 'junior-secondary' || section === 'senior-secondary') {
                secondarySubGroup.style.display = 'block';
            }
        } else if (role === 'teacher') {
            secondarySubGroup.style.display = 'none';
        }
    };

    window.populateSeniorStreams = function() {
        const level = document.getElementById('secondaryLevel').value;
        const seniorStreamGroup = document.getElementById('seniorStreamGroup');
        if (seniorStreamGroup) {
            seniorStreamGroup.style.display = (level === 'senior') ? 'block' : 'none';
        }
    };

    // Form Submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullname = document.getElementById('fullName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const role = document.getElementById('role').value;
        const schoolSection = document.getElementById('schoolSection').value || null;
        const secondaryLevel = document.getElementById('secondaryLevel')?.value || null;
        const seniorStream = document.getElementById('seniorStream')?.value || null;

        if (!fullname || !email || !password || !role) {
            messageEl.style.color = "red";
            messageEl.textContent = "Please fill all required fields.";
            return;
        }

        if (!isValidEmail(email)) {
            messageEl.style.color = "red";
            messageEl.textContent = "Invalid email format.";
            return;
        }

        if (!isStrongPassword(password)) {
            messageEl.style.color = "red";
            messageEl.textContent = "Password is not strong enough.";
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Creating account...";

        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: { emailRedirectTo: window.location.origin + '/login.html' }
            });

            if (error) throw error;

            await supabaseClient.from('profiles').insert({
                id: data.user.id,
                full_name: fullname,
                role: role,
                school_section: schoolSection,
                secondary_level: secondaryLevel,
                senior_stream: seniorStream,
                email: email,
                status: 'active'
            });

            messageEl.style.color = "green";
            messageEl.textContent = "✅ Registration successful! Check your email to confirm.";
            setTimeout(() => window.location.href = "login.html", 3000);

        } catch (error) {
            messageEl.style.color = "red";
            messageEl.textContent = error.message || "Registration failed.";
            submitBtn.disabled = false;
            submitBtn.textContent = "Register";
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
                const { data: profile, error: profileError } = await supabaseClient
                .from('profiles')
                .select('role, full_name')
                .filter('id', 'eq', data.user.id)
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
// ==================== STUDENT DASHBOARD ====================

function showStudentTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.getElementById(tab + 'Tab').style.display = 'block';
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');

    if (tab === 'results') loadStudentResults();
    if (tab === 'notes') loadStudentNotes();
}

// Load Student's Results
async function loadStudentResults() {
    const tbody = document.getElementById('resultsTableBody');
    if (!tbody) return;

    try {
        const { data, error } = await supabaseClient
            .from('results')
            .select('*')
            .eq('student_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        tbody.innerHTML = data && data.length > 0 
            ? data.map(r => `
                <tr>
                    <td>${r.subject}</td>
                    <td><strong>${r.score}</strong></td>
                    <td>${r.grade}</td>
                    <td>${r.term}</td>
                    <td>${new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
            `).join('')
            : `<tr><td colspan="5">No results uploaded yet</td></tr>`;
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5">Error loading results</td></tr>`;
    }
}

// Load Notes with Download
async function loadStudentNotes() {
    const container = document.getElementById('notesContainer');
    if (!container) return;

    try {
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('school_section, secondary_level, senior_stream')
            .eq('id', currentUser.id)
            .single();

        const { data, error } = await supabaseClient
            .from('notes')
            .select('*, profiles!uploaded_by(full_name)')
            .eq('target_class', profile?.school_section)
            .order('created_at', { ascending: false });

        if (error) throw error;

        container.innerHTML = data && data.length > 0 
            ? data.map(note => `
                <div class="note-card">
                    <h4>${note.title}</h4>
                    <p><strong>Teacher:</strong> ${note.profiles?.full_name || 'Unknown'}</p>
                    <p>${note.content}</p>
                    \( {note.file_url ? `<a href=" \){note.file_url}" target="_blank" class="download-btn">📥 Download Attachment</a>` : ''}
                    <small>Posted: ${new Date(note.created_at).toLocaleDateString()}</small>
                </div>
            `).join('')
            : `<p>No notes available yet for your class.</p>`;
    } catch (err) {
        container.innerHTML = `<p>Error loading notes</p>`;
    }
}

// ==================== TEACHER PORTAL ====================
async function loadTeacherDashboard() {
    await checkAuthAndLoadName();
    loadMyStudents();
    loadTeacherNotes();
}

// ==================== EXPANDED TEACHER FUNCTIONS ====================

let currentTeacherSection = null;

async function loadMyStudents() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    const { data: teacher } = await supabaseClient
        .from('profiles')
        .select('school_section')
        .eq('id', currentUser.id)
        .single();

    currentTeacherSection = teacher?.school_section;

    const { data, error } = await supabaseClient
        .from('profiles')
        .select('id, full_name, school_section, secondary_level, senior_stream')
        .eq('role', 'student')
        .eq('school_section', currentTeacherSection);

    if (error) {
        tbody.innerHTML = `<tr><td colspan="4">Error loading students</td></tr>`;
        return;
    }

    populateFilters(data);
    renderStudents(data);
}

function populateFilters(students) {
    const levels = [...new Set(students.map(s => s.secondary_level).filter(Boolean))];
    const streams = [...new Set(students.map(s => s.senior_stream).filter(Boolean))];

    const levelSelect = document.getElementById('filterLevel');
    levelSelect.innerHTML = '<option value="">All Levels</option>' + levels.map(l => `<option value="\( {l}"> \){l}</option>`).join('');

    const streamSelect = document.getElementById('filterStream');
    streamSelect.innerHTML = '<option value="">All Streams</option>' + streams.map(s => `<option value="\( {s}"> \){s}</option>`).join('');
}

function filterStudents() {
    const levelFilter = document.getElementById('filterLevel').value;
    const streamFilter = document.getElementById('filterStream').value;

    // Re-fetch or filter from cache (for simplicity, we'll re-query)
    loadMyStudents();
}

async function renderStudents(data) {
    const tbody = document.getElementById('studentsTableBody');
    // Add filtering logic here if needed
    tbody.innerHTML = data.map(student => `
        <tr>
            <td>${student.full_name}</td>
            <td>${student.secondary_level || student.school_section}</td>
            <td>${student.senior_stream || '-'}</td>
            <td><button onclick="inputResultFor('\( {student.id}', ' \){student.full_name}')">Input Result</button></td>
        </tr>
    `).join('');
}

// Result Input
async function inputResultFor(studentId, studentName) {
    showTeacherTab('results');
    const select = document.getElementById('resultStudent');
    select.innerHTML = `<option value="\( {studentId}"> \){studentName}</option>`;
}

document.getElementById('resultForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageEl = document.getElementById('resultMessage');

    const studentId = document.getElementById('resultStudent').value;
    const subject = document.getElementById('resultSubject').value;
    const score = parseFloat(document.getElementById('resultScore').value);
    const grade = document.getElementById('resultGrade').value;
    const term = document.getElementById('resultTerm').value;

    const { error } = await supabaseClient.from('results').insert({
        student_id: studentId,
        subject,
        score,
        grade,
        term,
        uploaded_by: currentUser.id
    });

    if (error) {
        messageEl.style.color = 'red';
        messageEl.textContent = 'Failed to save result';
    } else {
        messageEl.style.color = 'green';
        messageEl.textContent = 'Result saved successfully!';
        e.target.reset();
    }
});



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
    // ==================== NOTES UPLOAD (Fixed) ====================
async function uploadNote() {
    const title = document.getElementById('noteTitle')?.value.trim();
    const content = document.getElementById('noteContent')?.value.trim();
    const fileInput = document.getElementById('noteFile');
    const messageEl = document.getElementById('noteMessage');

    if (!title || !content) {
        if (messageEl) messageEl.textContent = "Title and content are required!";
        return;
    }

    messageEl.textContent = "Uploading...";

    try {
        let fileUrl = null;

        // Handle file upload if selected
        if (fileInput && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `\( {Date.now()}. \){fileExt}`;

            const { data, error } = await supabaseClient.storage
                .from('notes')
                .upload(fileName, file);

            if (error) throw error;

            fileUrl = supabaseClient.storage.from('notes').getPublicUrl(fileName).data.publicUrl;
        }

        // Save note to database
        const { error: dbError } = await supabaseClient
            .from('notes')
            .insert({
                title: title,
                content: content,
                file_url: fileUrl,
                uploaded_by: currentUser?.id,
                target_class: document.getElementById('targetClass')?.value || null,
                created_at: new Date()
            });

        if (dbError) throw dbError;

        messageEl.style.color = "green";
        messageEl.textContent = "✅ Note uploaded successfully!";

        // Clear form
        if (document.getElementById('noteForm')) document.getElementById('noteForm').reset();

    } catch (error) {
        console.error(error);
        messageEl.style.color = "red";
        messageEl.textContent = "Upload failed: " + error.message;
    }
}
    // ==================== LOAD USERS & STUDENTS (Safe Addition) ====================

async function loadAllUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('full_name, email, role, school_section, class_level')
            .order('role', { ascending: true });

        if (error) throw error;

        tbody.innerHTML = data && data.length > 0 
            ? data.map(user => `
                <tr>
                    <td>${user.full_name || 'N/A'}</td>
                    <td>${user.email || 'N/A'}</td>
                    <td>${user.role || 'N/A'}</td>
                    <td>${user.school_section || 'N/A'}</td>
                    <td>${user.class_level || 'N/A'}</td>
                </tr>
            `).join('')
            : `<tr><td colspan="5">No users found yet</td></tr>`;
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="5">Error loading users</td></tr>`;
    }
}

async function loadMyStudents() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('full_name, class_level')
            .eq('role', 'student');

        if (error) throw error;

        tbody.innerHTML = data && data.length > 0 
            ? data.map(student => `
                <tr>
                    <td>${student.full_name}</td>
                    <td>${student.class_level || 'N/A'}</td>
                    <td><button>View</button></td>
                </tr>
            `).join('')
            : `<tr><td colspan="3">No students registered yet</td></tr>`;
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="3">Error loading students</td></tr>`;
    }
}
// ==================== UPDATED ADMIN USERS LOADER ====================
async function loadAllUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('id, full_name, email, role, school_section, secondary_level, senior_stream, status')
            .order('role');

        if (error) throw error;

        tbody.innerHTML = data && data.length > 0 
            ? data.map(user => `
                <tr>
                    <td>${user.full_name || 'N/A'}</td>
                    <td>${user.email || 'N/A'}</td>
                    <td>${user.role || 'N/A'}</td>
                    <td>${user.school_section || '-'}</td>
                    <td>${user.secondary_level || '-'}</td>
                    <td>${user.senior_stream || '-'}</td>
                    <td>${user.status || 'active'}</td>
                    <td>
                        <button class="btn-small" onclick="editUser('${user.id}')">Edit</button>
                        <button class="btn-small" onclick="resetPassword('${user.email}')">Reset PW</button>
                    </td>
                </tr>
            `).join('')
            : `<tr><td colspan="8">No users found</td></tr>`;
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="8">Error loading users</td></tr>`;
    }
}

// Tab Switching
function showAdminTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.getElementById(tab + 'Tab').style.display = 'block';
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');

    if (tab === 'users') loadAllUsers();
}



// Load All Results
async function loadAllResults() {
    const tbody = document.getElementById('resultsTableBody');
    if (!tbody) return;

    const { data } = await supabaseClient
        .from('results')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false });

    tbody.innerHTML = data.map(r => `
        <tr>
            <td>${r.profiles?.full_name || 'Unknown'}</td>
            <td>${r.subject}</td>
            <td>${r.score}</td>
            <td>${r.grade}</td>
            <td>${r.term}</td>
            <td><button onclick="editResult('${r.id}')">Edit</button></td>
        </tr>
    `).join('');
}

// Placeholder functions (expand later)
async function resetPassword(email) {
    if (confirm(`Reset password for ${email}?`)) {
        alert("Password reset link sent (implement full logic)");
    }
}

function editUser(id) {
    alert("Edit user functionality - coming soon");
}

function suspendUser(id) {
    if (confirm("Suspend this user?")) {
        alert("User suspended (implement update status)");
    }
}

function editResult(id) {
    alert("Edit result - coming soon");
}

function closeModal() {
    document.getElementById('actionModal').style.display = 'none';
}
// ==================== ADMIN USER MANAGEMENT ====================
async function loadAllUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('id, full_name, email, role, school_section, secondary_level, senior_stream, status')
            .order('role');

        if (error) throw error;

        tbody.innerHTML = data && data.length > 0 
            ? data.map(user => `
                <tr>
                    <td>${user.full_name || 'N/A'}</td>
                    <td>${user.email || 'N/A'}</td>
                    <td>${user.role || 'N/A'}</td>
                    <td>${user.school_section || '-'}</td>
                    <td>${user.secondary_level || '-'}</td>
                    <td>${user.senior_stream || '-'}</td>
                    <td><strong>${user.status || 'active'}</strong></td>
                    <td>
                        <button class="btn-small" onclick="editUser('${user.id}')">Edit</button>
                        <button class="btn-small" onclick="suspendUser('${user.id}')">Suspend</button>
                        <button class="btn-small btn-danger" onclick="deleteUser('${user.id}')">Delete</button>
                    </td>
                </tr>
            `).join('')
            : `<tr><td colspan="8">No users found</td></tr>`;
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="8">Error loading users</td></tr>`;
    }
}

// Edit User
async function editUser(userId) {
    const { data: user } = await supabaseClient.from('profiles').select('*').eq('id', userId).single();
    if (!user) return;

    document.getElementById('editUserId').value = user.id;
    document.getElementById('editFullName').value = user.full_name || '';
    document.getElementById('editEmail').value = user.email || '';
    document.getElementById('editStatus').value = user.status || 'active';

    document.getElementById('editModal').style.display = 'flex';
}

// Suspend User
async function suspendUser(userId) {
    if (!confirm("Suspend this user?")) return;

    const { error } = await supabaseClient
        .from('profiles')
        .update({ status: 'suspended' })
        .eq('id', userId);

    if (error) alert("Failed to suspend user");
    else {
        alert("User suspended successfully");
        loadAllUsers();
    }
}

// Delete User
async function deleteUser(userId) {
    if (!confirm("⚠️ Permanently delete this user? This action cannot be undone.")) return;

    const { error } = await supabaseClient
        .from('profiles')
        .delete()
        .eq('id', userId);

    if (error) alert("Failed to delete user");
    else {
        alert("User deleted successfully");
        loadAllUsers();
    }
}

// Close Modal
function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Tab Control
function showAdminTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.getElementById(tab + 'Tab').style.display = 'block';
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');

    if (tab === 'users') loadAllUsers();
}

// Form Submit Handler
document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.getElementById('editUserForm');
    if (editForm) editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editUserId').value;
        const fullName = document.getElementById('editFullName').value;
        const email = document.getElementById('editEmail').value;
        const status = document.getElementById('editStatus').value;

        const { error } = await supabaseClient
            .from('profiles')
            .update({ full_name: fullName, email: email, status: status })
            .eq('id', id);

        if (error) alert("Update failed");
        else {
            alert("User updated successfully!");
            closeModal();
            loadAllUsers();
        }
    });
});



   
};

// Make functions globally accessible
window.logout = logout;
window.checkAuthAndLoadName = checkAuthAndLoadName;
window.uploadNote = uploadNote;
window.loadAllUsers = loadAllUsers;
//window.loadMyStudents = loadMyStudents;
window.updateRoleOptions = updateRoleOptions;
window.populateSubOptions = populateSubOptions;
window.populateSeniorStreams = populateSeniorStreams;
window.changeSlide = changeSlide;
//window.updateRoleOptions = updateRoleOptions;
//window.populateClassOptions = populateClassOptions;
window.showAdminTab = showAdminTab;
window.loadStudentDashboard = loadStudentDashboard;
window.loadTeacherDashboard = loadTeacherDashboard;
window.loadAdminDashboard = loadAdminDashboard;
window.showAdminTab = showAdminTab;
window.loadAllUsers = loadAllUsers;
window.loadAllResults = loadAllResults;
window.resetPassword = resetPassword;
window.editUser = editUser;
window.suspendUser = suspendUser;
window.editResult = editResult;
window.closeModal = closeModal;
window.loadAllUsers = loadAllUsers;
window.editUser = editUser;
window.suspendUser = suspendUser;
window.deleteUser = deleteUser;
window.closeModal = closeModal;
window.showAdminTab = showAdminTab;
window.showStudentTab = showStudentTab;
window.loadStudentResults = loadStudentResults;
window.loadStudentNotes = loadStudentNotes;;
window.showTeacherTab = showTeacherTab;
window.loadMyStudents = loadMyStudents;
window.filterStudents = filterStudents;
window.inputResultFor = inputResultFor;




