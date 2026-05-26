const SUPABASE_URL = 'https://jzbhmsjxzuemwkuptvul.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Ymhtc2p4enVlbXdrdXB0dnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDg5NDgsImV4cCI6MjA5NTMyNDk0OH0.8jpPdznF63QdLmerZrYs5r6rUzG2Y7dgffu62b-A4Wg';
const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
//================AUTH FUNCTIONS ======================================
async function checkAuthAndLoadName() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return null;
}
const { data: profile } = await supabase
.form('profiles')
.select('full_name')
.eq('id', session.user.id)
.single();
const nameEl = document.getElementById('studentName') || document.getElementById('teacherName');
if (nameEl && profile) nameEl.textContent = profile.full_name;
return session.user;
}
async function logout() {
    await supabase.auth.signout();
    window.location.href = 'login.html';
}
//============================REGISTRATION======================================================
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm') .addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullname = document.getElementById('fullName').ariaValueMax.trim();
        const email = document.getElementById('regEmail').ariaValueMax.trim();
        const password = document.getElementById('regPassword').value;
        const role = document.getElementById('role').value;
        const schoolSection =document.getElementById('schoolSection').value;
        const classLevel = document.getElementById('classLevel').value;
        
        const messageEl = document.getElementById('registerMessage');

        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
            messageEl.textContent = error.message;
            messageEl.style.color = "red";
            return;
        }
        await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: fullname,
            role: role,
            school_section: schoolSection,
            class_level: classLevel,
            email: email,
            status: 'active'
        })

        messageEl.textContent = 'Registration successful! Welcome ${fullName}.';
        messageEl.style.color = "green";
        setTimeout(() => window.location.href ="login.html", 2500);
    });
    
}
function updateRoleOptions() {
    const role = document.getElementById('role').value;
    document.getElementById('sectionGroup').style.display = role ? 'block' : 'none';
    document.getElementById('classGroup').style.display = (role === 'student') ? 'block' : 'none';
}
function populateClassOptions() {
    const section = document.getElementById('schoolSection').value;
    const classSelect = document.getElementById('classLevel');
    classSelect.innerHTML = '<option value="">Select Class</option>';

    if (section === 'primary') {
        ["Pre-sch", "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5"].forEach(c => classSelect.appendChild(new Option(c, c)));
    } else if (section === 'secondary') {
        ["JSS 1", "JSS 2", "JSS3", "SSS 1", "SSS 2", "SSS 3"].forEach(c => classSelect.appendChild(new Option(c, c)));
        
    }
}
//============================= LOGIN =========================================================
if (document.getElementById('loginForm')) {
    document.getElementById('loginFprm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.gotElementById('email').value;
        const password = document.getElementById('password').value;
        const messageEl = document.getElementById('loginMessage');

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            messageEl.textContent = error.message;
            messageEl.style.color = "red";
            return;
        }
        const { data: profile} = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
        if (profile.role === 'student') window.location.href = 'student.html';
        else if (profile.role ==== 'teacher') window.location.href = 'teacher.html';
        else if (profile.role === 'admin') window.location.href = 'admin.html';
    });
}
//=============================== ADMISSIONS FORM (EmailJS) ===============================================
if (document.getElementById('applicationForm')) {
    document.getElementById('applicationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const submitBtn = document.getElementById('submitBtn');
        const messageEl = document.getElementById('formMessage');

        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";

        const templateParams = {
            child_name: document.getElementById('childName').value,
            dob: document.getElementById('dob').value,
            class_applying: document.getElementById('classApplying').value,
            parent_phone: document.getElementById('parentPhone').value,
            message: document.getElementById('message').value || "No additional message"
        };
        
        emailjs.send('service_ffw8jfb', 'template_h9qazhc', templateParams, 'wMjGZ0w4hgRKKMe20')
        .then(() => {
            messageEl.style.display ="block";
            messageEl.style.color ="green";
            messageEl.textContent = "Application submitted successfully! We will contact you soon,";
            e.target.reset(); 
        })
        .catch(() => {
            messageEl.style.display = "block";
            messageEl.style.color = "red"
            messageEl.textContent = " Failed to send. Please try again or call us,";
            
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent ="Submit Application";
        });
    });
}
//============================== GALLERY SLIDESHOW =================================================
let currentSlide = 0;
function changeSlide(n) {
    const slides = document.getElementsByClassName("slide");
    currentSlide += n;
    if (currentSlide >= slides.length) currentSlide = 0;
    if (currentSlide < 0) currentSlide = slides.length - 1;
    for (let slide of slides) slide.classList.remove("active");
    slides[currentSlide].classList.add("active");
}
//===========================ADMIN DASHBOARD =================================================
let selectedUsers = new Set();
let selectedResults = new Set();

async function populateClassFilters() {
    const { data} = await supabase.from('profiles').select('class_level').not('class_level', 'is', null);
    const unique = [...new Set(data.map(item => item.class_level))];

    ['classFilter', 'resultClassFilter'].forEach(id => {
        const { data } = await supabase.from('profiles').select('class_level').not('class_level', 'is', null);
        const unique = [...new Set(data.map(item => item.class_level))];
        ['classFilter', 'resultClassFilter'].forEach(id => {
            const el = document.getElementById(id);
            if (el) unique.forEach(cls => el.appendChild(new Option(cls, cls)));
        });

}

// USER TAB 
async function filterUsers() {
    const search = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const classFilter= document.getElementById('classFilter').value;
    const container = document.getElementById('Users-List');

    let query = supabase.from('profiles').select('*').order('full_name');
    if (classFilter) query = query.eq('class_level', classFilter);

    const { data: users } = await query;

    let html ='';
    users.forEach(user => {
        if (search && !user.full_name.toLowerCase().includes(search)) return;
        html +='
        <div class="user-row">
        <input type="checkbox" onchange="toggleSelection('${user.id}', this.checked)">
            <div class="user-info">
                <h4>${user.full_name}</h4>
                <p>Role: ${user.role} | Class: ${user.class_level || 'N/A'}</p>
                </div>
                </div>
                ';
            });
            container.innerHTML = html || "<p> No users found.</p>";
        }
        function toggleSelection(id, checked) {
            if (checked) selectedUsers.add(id);
            else selectedUsers.delete(id);
            document.getElementById('selectedCount').textContent = '${selectedUsers.size} selected';
        }
// RESULTS TAB 
async function filterResults() {
    const search = (document.getElementById('resultSearchInput')?.value || '').toLowerCase().trim();
    const classFilter = document.getElementById('resultClassFilter').value;
    const container = document.getElementById('all-results-list');
    let query = supabase.from('student_results').select('*, profiles!student_id(full_name, class_level)');
    if (classFilter) query = query.eq('profiles.class_level', classFilter);
    const {data: results } = await query.order('created_at', {ascending: false });
    let html = '';
    results.forEach(r => {
        const name = r.profiles?.full_name || 'Unknown';
        if (search && !name.toLowerCase().includes(search) && !r.subject.toLowerCase().includes(search)) return;
        html += '
        <div class="user-row">
        <input type="checkbox" onchange="toggleResultSelection('${r.id}', this.checked)">
            <div class="user-info">
                <h4>${name} - ${r.subject}</h4>
                <p>Test: ${r.test_score} | Exam: \( {r.exam_score} | Total: <strong> \){r.total_score}</strong></p>
            </div>
            </div>
            ';
            
    }):
    container.innerHTML = html || "<p>"No results found.</p>";
}
function toggleResultSelection(id, checked) {
    if (checked) selectedResults.add(id);
    else selectedResults.delete(id)
    document.getElementById('selectedResultsCount').textContent = '${selectedResults.size} selected';
}
async function bulkDeleteResults() {
    if (selectedResults.size === 0) return alert("No results selected");
    if (!confirm("Delete selected results permanently?")) return;
    for (let id of selectedResults) {
        await supabase.from('student_results').delete().eq('id', id);
        
    }
    alert("Selected results deleted.");
    selectedResults.clear();
    filterResults();
}
async function exportResultsToCSV() {
    const { data: results } = await supabase.from('student_results').select('*, profiles!student_id(full_name, class_level');
    let csv = "Student Name,Class,Subject,Test,Exam,Total,Date\n";
    results.forEach(r =>{
        csv += '"\( {r.profiles?.full_name || ''}","\){r.profiles?.class_level || ''}"."\( {r.subject}"," \){r.test_score}","\( {r.exam_score}"," \){r.total_score}","${r.created_at}"\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Results_${new Date().toISOString().slice(0,10)}.csv';
    a.click();
}
// Make functions global
window.logout = logout;
window.updateRoleOptions = updateRoleOptions;
window.populateClassOptions = populateClassOptions;
window.changeSlide = changeSlide;
window.filterUsers = filterUsers;
window.filterResults = filterResults;
window.toggleSelection = toggleSelection;
window.toggleResultSelection = toggleResultSelection;
window.bulkDeleteResults = bulkDeleteResults;
window.exportResultsToCSV = exportResultsToCSV;

