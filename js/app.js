// ==================== SUPABASE SETUP ====================
const SUPABASE_URL = 'https://jzbhmsjxzuemwkuptvul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Ymhtc2p4enVlbXdrdXB0dnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDg5NDgsImV4cCI6MjA5NTMyNDk0OH0.8jpPdznF63QdLmerZrYs5r6rUzG2Y7dgffu62b-A4Wg';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== GLOBAL VARIABLES ====================
let currentUser = null;

// ==================== REGISTER HELPER FUNCTIONS ====================
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

    // Register & Login (kept working)
    if (document.getElementById('registerForm') || document.getElementById('loginForm')) {
        console.log("Auth pages loaded");
    }

    // ==================== STUDENT DASHBOARD ====================
    if (document.getElementById('studentDashboard')) {

        async function initStudentDashboard() {
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

            loadStudentResults();
            loadStudentNotes();
        }

        // Tab Switching
        window.showStudentTab = function(tab) {
            document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
            const activeTab = document.getElementById(tab + 'Tab');
            if (activeTab) activeTab.style.display = 'block';

            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            const btn = document.querySelector(`[onclick="showStudentTab('${tab}')"]`);
            if (btn) btn.classList.add('active');
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

        // ==================== NOTES FUNCTIONALITY ====================
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
                    .select(`
                        *,
                        profiles!uploaded_by (full_name)
                    `)
                    .eq('target_class', profile?.school_section)
                    .order('created_at', { ascending: false });

                container.innerHTML = notes?.length ? notes.map(note => `
                    <div class="note-card" style="border:1px solid #ddd; padding:15px; margin-bottom:15px; border-radius:8px;">
                        <h4>${note.title}</h4>
                        <p><strong>Teacher:</strong> ${note.profiles?.full_name || 'Unknown'}</p>
                        <p>${note.content}</p>
                        ${note.file_url ? 
                            `<a href="${note.file_url}" target="_blank" class="download-btn" style="color:#27ae60;">📥 Download Attachment</a>` : ''}
                        <small>Posted: ${new Date(note.created_at).toLocaleDateString()}</small>
                    </div>
                `).join('') : `<p>No notes available yet for your class.</p>`;
            } catch (err) {
                console.error(err);
                container.innerHTML = `<p>Error loading notes.</p>`;
            }
        };

        // Initialize
        initStudentDashboard();
    }

    console.log("✅ Maas Modern App Loaded Successfully");
});
