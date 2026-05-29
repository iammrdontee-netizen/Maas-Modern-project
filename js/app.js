// ==================== SUPABASE SETUP ====================
const SUPABASE_URL = 'https://jzbhmsjxzuemwkuptvul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Ymhtc2p4enVlbXdrdXB0dnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDg5NDgsImV4cCI6MjA5NTMyNDk0OH0.8jpPdznF63QdLmerZrYs5r6rUzG2Y7dgffu62b-A4Wg';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== GLOBAL VARIABLES ====================
let currentUser = null;

// ==================== DOM READY ====================
document.addEventListener('DOMContentLoaded', () => {

    // ==================== REGISTER FORM (Fixed + Dynamic Filtering) ====================
    if (document.getElementById('registerForm')) {
        const registerForm = document.getElementById('registerForm');
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const messageEl = document.getElementById('registerMessage');

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
                    errorSpan.style.color = '#e74c3c';
                    field.parentNode.appendChild(errorSpan);
                }
                errorSpan.textContent = msg;
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

            const isValid = fullname.length > 0 && isValidEmail(email) && isStrongPassword(password) && role !== '';
            if (submitBtn) submitBtn.disabled = !isValid;
        }

        // Real-time Validation
        const emailField = document.getElementById('regEmail');
        const passwordField = document.getElementById('regPassword');

        if (emailField) emailField.addEventListener('input', () => {
            if (emailField.value.trim() && !isValidEmail(emailField.value)) showFieldError('regEmail', 'Please enter a valid email address');
            else clearFieldError('regEmail');
            checkFormValidity();
        });

        if (passwordField) passwordField.addEventListener('input', () => {
            if (passwordField.value && !isStrongPassword(passwordField.value)) showFieldError('regPassword', 'Password must be 8+ chars (Upper, lower, number & special)');
            else clearFieldError('regPassword');
            checkFormValidity();
        });

        ['fullName', 'role'].forEach(id => {
            const field = document.getElementById(id);
            if (field) field.addEventListener('change', checkFormValidity);
        });

        // Dynamic Dropdown Functions
        window.updateRoleOptions = function() {
            const role = document.getElementById('role').value;
            const sectionGroup = document.getElementById('sectionGroup');
            if (sectionGroup) sectionGroup.style.display = (role === 'student' || role === 'teacher') ? 'block' : 'none';

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
            if (seniorStreamGroup) seniorStreamGroup.style.display = (level === 'senior') ? 'block' : 'none';
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

            if (!isValidEmail(email) || !isStrongPassword(password)) {
                messageEl.style.color = "red";
                messageEl.textContent = "Please fix the errors above.";
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
                    school_section: schoolSection,
                    secondary_level: secondaryLevel,
                    senior_stream: seniorStream,
                    email: email,
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
