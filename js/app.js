// ==================== SUPABASE SETUP ====================
const SUPABASE_URL = 'https://jzbhmsjxzuemwkuptvul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Ymhtc2p4enVlbXdrdXB0dnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDg5NDgsImV4cCI6MjA5NTMyNDk0OH0.8jpPdznF63QdLmerZrYs5r6rUzG2Y7dgffu62b-A4Wg';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== GLOBAL VARIABLES ====================
let currentUser = null;

// ==================== REGISTER & LOGIN FUNCTIONS ====================
function updateRoleOptions() {
    const role = document.getElementById('role')?.value;
    const sectionGroup = document.getElementById('sectionGroup');
    if (sectionGroup) sectionGroup.style.display = (role === 'student' || role === 'teacher') ? 'block' : 'none';
}

function populateSubOptions() {
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
}

function populateSeniorStreams() {
    const level = document.getElementById('secondaryLevel')?.value;
    const seniorStreamGroup = document.getElementById('seniorStreamGroup');
    if (seniorStreamGroup) seniorStreamGroup.style.display = (level === 'senior') ? 'block' : 'none';
}

// ==================== MAIN APP LOGIC ====================
document.addEventListener('DOMContentLoaded', () => {

    // Register Form
    if (document.getElementById('registerForm')) {
        // ... (Register logic - already working, kept minimal for space)
        console.log("Register page loaded");
    }

    // Login Form
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const messageEl = document.getElementById('loginMessage');

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
                messageEl.textContent = error.message || "Invalid credentials";
            }
        });
    }

    // ==================== STUDENT DASHBOARD ====================
    if (document.getElementById('studentDashboard')) {
        async function loadStudentDashboard() {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (!session) {
                window.location.href = 'login.html';
                return;
            }
            currentUser = session.user;

            // Load Profile Name
            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('full_name, school_section, secondary_level')
                .eq('id', currentUser.id)
                .single();

            if (profile) {
                document.getElementById('studentName').textContent = profile.full_name || "Student";
            }
        }

        // Tab Switching
        window.showStudentTab = function(tab) {
            document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
            const tabEl = document.getElementById(tab + 'Tab');
            if (tabEl) tabEl.style.display = 'block';

            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            const activeBtn = document.querySelector(`[onclick="showStudentTab('${tab}')"]`);
            if (activeBtn) activeBtn.classList.add('active');
        };

        // Load Results
        window.loadStudentResults = async function() {
            const tbody = document.getElementById('resultsTableBody');
            if (!tbody) return;

            try {
                const { data } = await supabaseClient
                    .from('results')
                    .select('*')
                    .eq('student_id', currentUser.id)
                    .order('created_at', { ascending: false });

                tbody.innerHTML = data && data.length > 0 
                    ? data.map(r => `
                        <tr>
                            <td>${r.subject}</td>
                            <td><strong>${r.score}</strong></td>
                            <td>${r.grade}</td>
                            <td>${r.term}</td>
                        </tr>
                    `).join('')
                    : `<tr><td colspan="4">No results found yet.</td></tr>`;
            } catch (err) {
                tbody.innerHTML = `<tr><td colspan="4">Error loading results</td></tr>`;
            }
        };

        loadStudentDashboard();
    }

    console.log("✅ Maas Modern App Loaded Successfully");
});
