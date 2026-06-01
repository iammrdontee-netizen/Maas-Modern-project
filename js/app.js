// ==================== SUPABASE SETUP ====================
const SUPABASE_URL = 'https://jzbhmsjxzuemwkuptvul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Ymhtc2p4enVlbXdrdXB0dnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDg5NDgsImV4cCI6MjA5NTMyNDk0OH0.8jpPdznF63QdLmerZrYs5r6rUzG2Y7dgffu62b-A4Wg';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== GLOBAL VARIABLES ====================
let currentUser = null;

// ==================== REGISTER HELPER FUNCTIONS (Safe) ====================
window.updateRoleOptions = function() {
    const role = document.getElementById('role')?.value;
    const sectionGroup = document.getElementById('sectionGroup');
    if (sectionGroup) sectionGroup.style.display = (role === 'student' || role === 'teacher') ? 'block' : 'none';
};

window.populateSubOptions = function() {
    const role = document.getElementById('role')?.value;
    const section = document.getElementById('schoolSection')?.value;
    const secondarySubGroup = document.getElementById('secondarySubGroup');
    const seniorStreamGroup = document.getElementById('seniorStreamGroup');

    if (!secondarySubGroup || !seniorStreamGroup) return;
    seniorStreamGroup.style.display = 'none';

    if (role === 'student') {
        secondarySubGroup.style.display = (section === 'junior-secondary' || section === 'senior-secondary') ? 'block' : 'none';
    } else if (role === 'teacher') {
        secondarySubGroup.style.display = 'none';
    }
};

window.populateSeniorStreams = function() {
    const level = document.getElementById('secondaryLevel')?.value;
    const seniorStreamGroup = document.getElementById('seniorStreamGroup');
    if (seniorStreamGroup) seniorStreamGroup.style.display = (level === 'senior') ? 'block' : 'none';
};

// ==================== MAIN LOGIC ====================
document.addEventListener('DOMContentLoaded', () => {

    // ==================== REGISTER FORM ====================
    if (document.getElementById('registerForm')) {
        const submitBtn = document.getElementById('registerForm').querySelector('button[type="submit"]');
        const messageEl = document.getElementById('registerMessage');

        function checkFormValidity() {
            const fullname = document.getElementById('fullName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const role = document.getElementById('role').value;
            submitBtn.disabled = !(fullname.length > 2 && email.length > 5 && password.length >= 6 && role);
        }

        ['fullName', 'regEmail', 'regPassword', 'role'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', checkFormValidity);
        });

        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullname = document.getElementById('fullName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const role = document.getElementById('role').value;

            if (!fullname || !email || !password || !role) {
                messageEl.style.color = "red";
                messageEl.textContent = "Please fill all fields.";
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = "Creating account...";

            try {
                const { data, error } = await supabaseClient.auth.signUp({
                    email, password,
                    options: { emailRedirectTo: window.location.origin + '/login.html' }
                });

                if (error) throw error;

                await supabaseClient.from('profiles').insert({
                    id: data.user.id,
                    full_name: fullname,
                    role: role,
                    school_section: document.getElementById('schoolSection')?.value || null,
                    secondary_level: document.getElementById('secondaryLevel')?.value || null,
                    senior_stream: document.getElementById('seniorStream')?.value || null,
                    status: 'active'
                });

                messageEl.style.color = "green";
                messageEl.textContent = "✅ Registration successful! Check your email to confirm.";
                setTimeout(() => window.location.href = "login.html", 2500);
            } catch (error) {
                messageEl.style.color = "red";
                messageEl.textContent = error.message || "Registration failed.";
                submitBtn.disabled = false;
                submitBtn.textContent = "Register";
            }
        });
    }

    // ==================== LOGIN FORM ====================
    if (document.getElementById('loginForm')) {
        const messageEl = document.getElementById('loginMessage');

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            messageEl.textContent = "Logging in...";
            messageEl.style.color = "blue";

            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
                if (error) throw error;

                currentUser = data.user;

                const { data: profile } = await supabaseClient
                    .from('profiles')
                    .select('role')
                    .eq('id', currentUser.id)
                    .single();

                if (profile?.role === 'teacher') window.location.href = 'teacher.html';
                else if (profile?.role === 'admin') window.location.href = 'admin.html';
                else window.location.href = 'student.html';

            } catch (error) {
                messageEl.style.color = "red";
                messageEl.textContent = error.message || "Invalid email or password.";
            }
        });
    }

    // ==================== STUDENT DASHBOARD ====================
    if (document.getElementById('studentDashboard')) {
        window.checkAuthAndLoadName = async function() {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (!session) {
                window.location.href = 'login.html';
                return;
            }
            currentUser = session.user;

            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('full_name')
                .eq('id', currentUser.id)
                .single();

            if (profile && document.getElementById('studentName')) {
                document.getElementById('studentName').textContent = profile.full_name || "Student";
            }
        };

        window.showStudentTab = function(tab) {
            document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
            const activeTab = document.getElementById(tab + 'Tab');
            if (activeTab) activeTab.style.display = 'block';

            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            const btn = document.querySelector(`[onclick="showStudentTab('${tab}')"]`);
            if (btn) btn.classList.add('active');
        };

        window.loadStudentResults = async function() {
            const tbody = document.getElementById('resultsTableBody');
            if (!tbody) return;

            try {
                const { data } = await supabaseClient
                    .from('results')
                    .select('*')
                    .eq('student_id', currentUser.id)
                    .order('created_at', { ascending: false });

                tbody.innerHTML = data?.length ? data.map(r => `
                    <tr>
                        <td>${r.subject}</td>
                        <td><strong>${r.score}</strong></td>
                        <td>${r.grade}</td>
                        <td>${r.term}</td>
                    </tr>
                `).join('') : `<tr><td colspan="4">No results yet.</td></tr>`;
            } catch (e) {
                tbody.innerHTML = `<tr><td colspan="4">Error loading results</td></tr>`;
            }
        };

        window.loadStudentNotes = async function() {
            const container = document.getElementById('notesContainer');
            if (!container) return;

            try {
                const { data: profile } = await supabaseClient
                    .from('profiles')
                    .select('school_section')
                    .eq('id', currentUser.id)
                    .single();

                const { data: notes } = await supabaseClient
                    .from('notes')
                    .select('*, profiles!uploaded_by(full_name)')
                    .eq('target_class', profile?.school_section)
                    .order('created_at', { ascending: false });

                container.innerHTML = notes?.length ? notes.map(note => `
                    <div class="note-card" style="padding:15px; border:1px solid #ddd; margin-bottom:15px; border-radius:8px;">
                        <h4>${note.title}</h4>
                        <p><strong>Teacher:</strong> ${note.profiles?.full_name || 'Unknown'}</p>
                        <p>${note.content}</p>
                        \( {note.file_url ? `<a href=" \){note.file_url}" target="_blank" style="color:#27ae60;">📥 Download Attachment</a>` : ''}
                        <small>Posted: ${new Date(note.created_at).toLocaleDateString()}</small>
                    </div>
                `).join('') : `<p>No notes available yet.</p>`;
            } catch (err) {
                container.innerHTML = `<p>Error loading notes.</p>`;
            }
        };

        window.logout = async function() {
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        };

        // Initialize
        window.checkAuthAndLoadName();
    }

    console.log("✅ Maas Modern App Loaded Successfully");
});
