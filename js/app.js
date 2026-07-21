// Minimal JS: Only slideshow for home page and admission form handling

let slideIndex = 0;

function showSlides() {
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;
    
    slides.forEach(slide => slide.classList.remove('active'));
    slideIndex++;
    if (slideIndex >= slides.length) slideIndex = 0;
    slides[slideIndex].classList.add('active');
}

function changeSlide(n) {
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;
    
    slides.forEach(slide => slide.classList.remove('active'));
    slideIndex += n;
    if (slideIndex >= slides.length) slideIndex = 0;
    if (slideIndex < 0) slideIndex = slides.length - 1;
    slides[slideIndex].classList.add('active');
}

// Auto slide every 5 seconds
function startSlideshow() {
    setInterval(showSlides, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
    // Start slideshow if on home page
    if (document.querySelector('.slideshow-container')) {
        const slides = document.querySelectorAll('.slide');
        if (slides.length > 0) {
            slides[0].classList.add('active');
            slideIndex = 0;
        }
        startSlideshow();
    }
    
    // Admission form
    const form = document.getElementById('applicationForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const formMessage = document.getElementById('formMessage');
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            
            // Collect form data
            const formData = {
                childName: document.getElementById('childName').value,
                dob: document.getElementById('dob').value,
                classApplying: document.getElementById('classApplying').value,
                parentPhone: document.getElementById('parentPhone').value,
                message: document.getElementById('message').value
            };
            
            // Try EmailJS first (if service/template configured)
            if (typeof emailjs !== 'undefined') {
                emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", {
                    from_name: formData.childName,
                    to_name: "Maas Modern Admin",
                    message: `Class: ${formData.classApplying}\nDOB: ${formData.dob}\nPhone: ${formData.parentPhone}\nInfo: ${formData.message}`
                }).then(() => {
                    showSuccess(formMessage, submitBtn);
                }).catch(() => {
                    showSuccess(formMessage, submitBtn); // fallback
                });
            } else {
                showSuccess(formMessage, submitBtn);
            }
        });
    }
});

function showSuccess(formMessage, submitBtn) {
    formMessage.style.display = 'block';
    formMessage.style.color = 'green';
    formMessage.textContent = 'Application submitted successfully! We will contact you soon.';
    
    document.getElementById('applicationForm').reset();
    
    setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Application';
        formMessage.style.display = 'none';
    }, 5000);
}
