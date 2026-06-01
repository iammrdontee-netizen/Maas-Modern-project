// ==================== SUPABASE SETUP ====================
const SUPABASE_URL = 'https://jzbhmsjxzuemwkuptvul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Ymhtc2p4enVlbXdrdXB0dnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDg5NDgsImV4cCI6MjA5NTMyNDk0OH0.8jpPdznF63QdLmerZrYs5r6rUzG2Y7dgffu62b-A4Wg';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== REGISTER HELPER FUNCTIONS ====================
window.updateRoleOptions = function() {
    const role = document.getElementById('role')?.value;
    const sectionGroup = document.getElementById('sectionGroup');
    if (sectionGroup) {
        sectionGroup.style.display = (role === 'student' || role === 'teacher') ? 'block' : 'none';
    }
};

window.populateSubOptions = function() {
    const role = document.getElementById('role')?.value;
    const section = document.getElementById('schoolSection')?.value;
    const secondarySubGroup = document.getElementById('secondarySubGroup');
    const seniorStreamGroup = document.getElementById('seniorStreamGroup');

    if (!secondarySubGroup || !seniorStreamGroup) return;
    seniorStreamGroup.style.display = 'none';

    if (role === 'student') {
        if (section === 'junior-secondary' || section === 'senior-secondary') {
            secondarySubGroup.style.display = 'block';
        } else {
            secondarySubGroup.style.display = 'none';
        }
    } else if (role === 'teacher') {
        secondarySubGroup.style.display = 'none';
    }
};

window.populateSeniorStreams = function() {
    const level = document.getElementById('secondaryLevel')?.value;
    const seniorStreamGroup = document.getElementById('seniorStreamGroup');
    if (seniorStreamGroup) {
        seniorStreamGroup.style.display = (level === 'senior') ? 'block' : 'none';
    }
};

// ==================== MAIN LOGIC ====================
document.addEventListener('DOMContentLoaded', () => {

    // Register Form
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

    console.log("✅ Maas Modern App Loaded Successfully");
});
