document.documentElement.classList.add('js-enabled');

document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.vision-section, .knowledge-section, .signup-content');
    
    if (sections.length === 0) {
        console.log("No sections found for animation");
        return;
    }

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    sections.forEach(section => observer.observe(section));
});