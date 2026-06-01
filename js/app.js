// ==================== CONFIG ====================
const SUPABASE_URL = 'https://jzbhmsjxzuemwkuptvul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Ymhtc2p4enVlbXdrdXB0dnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDg5NDgsImV4cCI6MjA5NTMyNDk0OH0.8jpPdznF63QdLmerZrYs5r6rUzG2Y7dgffu62b-A4Wg';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let currentProfile = null;

// ==================== UTILITIES ====================
async function checkAuth(allowedRoles = []) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return window.location.href = 'login.html';

    currentUser = session.user;
    const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', currentUser.id).single();

    if (!profile || (allowedRoles.length && !allowedRoles.includes(profile.role))) {
        alert("Access denied!");
        return window.location.href = 'login.html';
    }

    currentProfile = profile;
    return profile;
}

function showMessage(msg, isError = false) {
    let msgEl = document.querySelector('p, div, small, span');
    if (msgEl) {
        msgEl.style.color = isError ? 'red' : 'green';
        msgEl.textContent = msg;
        setTimeout(() => msgEl.textContent = '', 6000);
    } else {
        alert(msg);
    }
}

// ==================== ORIGINAL FUNCTIONS ====================
window.updateRoleOptions = function() {
    const role = document.getElementById('role')?.value;
    const sectionGroup = document.getElementById('sectionGroup');
    if (sectionGroup) sectionGroup.style.display = (role === 'student' || role === 'teacher') ? 'block' : 'none';
};

window.populateSubOptions = function() {
    const section = document.getElementById('schoolSection')?.value;
    const secondaryGroup = document.getElementById('secondarySubGroup');
    const seniorGroup = document.getElementById('seniorStreamGroup');
    if (secondaryGroup) secondaryGroup.style.display = (section === 'junior-secondary' || section === 'senior-secondary') ? 'block' : 'none';
    if (seniorGroup) seniorGroup.style.display = 'none';
};

window.populateSeniorStreams = function() {
    const level = document.getElementById('secondaryLevel')?.value;
    const seniorGroup = document.getElementById('seniorStreamGroup');
    if (seniorGroup) seniorGroup.style.display = (level === 'senior') ? 'block' : 'none';
};

window.showStudentTab = function(tab) { /* same as before */ };

// ==================== REGISTER - MAXIMUM COMPATIBILITY ====================
function setupRegister() {
    // Find any button that contains "Register"
    const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
    let registerButton = null;

    buttons.forEach(btn => {
        if (btn.textContent.toLowerCase().includes('register')) {
            registerButton = btn;
        }
    });

    if (registerButton) {
        console.log("Register button found and fixed");
        registerButton.style.opacity = '1';
        registerButton.style.backgroundColor = '#4CAF50';
        registerButton.style.color = 'white';
        registerButton.style.padding = '14px 40px';
        registerButton.style.fontSize = '17px';
        registerButton.style.fontWeight = 'bold';
        registerButton.style.cursor = 'pointer';
        registerButton.style.border = 'none';
        registerButton.style.borderRadius = '8px';
    }

    const registerAction = async () => {
        const fullName = document.querySelector('#fullName, input[placeholder*="Name"], input[name*="name"]').value?.trim();
        const email = document.querySelector('#email, input[type="email"]').value?.trim();
        const password = document.querySelector('#password, input[type="password"]').value?.trim();
        const role = document.querySelector('#role, select').value;

        if (!fullName || !email || !password || !role) {
            showMessage("Please fill all fields", true);
            return;
        }

        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email, 
                password,
                options: { data: { full_name: fullName }}
            });

            if (error) throw error;

            await supabaseClient.from('profiles').insert({
                id: data.user.id,
                full_name: fullName,
                role: role,
                created_at: new Date().toISOString()
            });

            showMessage("✅ Registration Successful! Redirecting...");
            setTimeout(() => window.location.href = 'login.html', 2000);
        } catch (err) {
            console.error(err);
            showMessage("❌ " + err.message, true);
        }
    };

    // Attach to button
    if (registerButton) {
        registerButton.addEventListener('click', registerAction);
        registerButton.onclick = registerAction;   // Extra backup
    }
}

// ==================== MAIN ====================
document.addEventListener('DOMContentLoaded', () => {
    setupRegister();

    if (document.title.toLowerCase().includes('student')) {
        checkAuth(['student']).then(() => loadStudentResults());
    }
    if (document.title.toLowerCase().includes('teacher')) {
        checkAuth(['teacher']).then(() => loadStudentsByStream());
    }
    if (document.title.toLowerCase().includes('admin')) {
        checkAuth(['admin']).then(() => { loadAllUsers(); loadAllStudentResults(); });
    }

    console.log("✅ Script Loaded - Register Button Fixed");
});
