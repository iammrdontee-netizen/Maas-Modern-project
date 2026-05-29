// ==================== SUPABASE SETUP ====================
const SUPABASE_URL = 'https://jzbhmsjxzuemwkuptvul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Ymhtc2p4enVlbXdrdXB0dnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDg5NDgsImV4cCI6MjA5NTMyNDk0OH0.8jpPdznF63QdLmerZrYs5r6rUzG2Y7dgffu62b-A4Wg';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== REGISTER FUNCTIONS ====================
function updateRoleOptions() {
    const role = document.getElementById('role').value;
    const sectionGroup = document.getElementById('sectionGroup');
    if (sectionGroup) {
        sectionGroup.style.display = (role === 'student' || role === 'teacher') ? 'block' : 'none';
    }
}

function populateSubOptions() {
    const role = document.getElementById('role').value;
    const section = document.getElementById('schoolSection').value;
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
    const level = document.getElementById('secondaryLevel').value;
    const seniorStreamGroup = document.getElementById('seniorStreamGroup');
    if (seniorStreamGroup) {
        seniorStreamGroup.style.display = (level === 'senior') ? 'block' : 'none';
    }
}

// ==================== REGISTER FORM LOGIC ====================
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const messageEl = document.getElementById('registerMessage');

        function isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }

        function isStrongPassword(password) {
            return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password);
        }

        // Form Submission
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullname = document.getElementById('fullName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const role = document.getElementById('role').value;

            if (!fullname || !email || !password || !role) {
                messageEl.style.color = "red";
                messageEl.textContent = "Please fill all required fields.";
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

                messageEl.style.color = "green";
                messageEl.textContent = "✅ Registration successful! Check your email.";
                setTimeout(() => window.location.href = "login.html", 2000);
            } catch (error) {
                messageEl.style.color = "red";
                messageEl.textContent = error.message || "Registration failed.";
                submitBtn.disabled = false;
                submitBtn.textContent = "Register";
            }
        });
    }

    console.log("✅ Register Page Loaded");
});
