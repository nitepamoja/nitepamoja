// --- 1. FIREBASE INITIALIZATION ---
// This is the most important line. It connects your website to your Firebase backend.
firebase.initializeApp(firebaseConfig);


// --- 2. HOMEPAGE ANIMATIONS ---
// This code handles all the visual effects for the homepage.
document.addEventListener('DOMContentLoaded', () => {

    // Logic for the "fade-in on scroll" animation
    const hiddenElements = document.querySelectorAll('.hidden');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            } else {
                entry.target.classList.remove('show');
            }
        });
    });
    hiddenElements.forEach((el) => observer.observe(el));


    // Logic for the auto-scrolling premium features section
    const scrollContainer = document.querySelector('.scroll-container');
    if (scrollContainer) {
        let scrollAmount = 0;
        let userIsInteracting = false;
        let autoScrollInterval;

        const startAutoScroll = () => {
            autoScrollInterval = setInterval(() => {
                if (!userIsInteracting) {
                    const scrollWidth = scrollContainer.scrollWidth;
                    
                    if (scrollAmount >= scrollWidth / 2) {
                        scrollAmount = 0;
                        scrollContainer.scrollTo({ left: 0, behavior: 'auto' });
                    } else {
                        scrollAmount += 0.5; // Scroll speed
                        scrollContainer.scrollTo({ left: scrollAmount, behavior: 'auto' });
                    }
                }
            }, 20); // Interval
        };

        const stopAutoScroll = () => {
            clearInterval(autoScrollInterval);
        };

        // Pause on any user interaction (mouse, touch, wheel)
        ['mouseenter', 'touchstart', 'mousedown', 'wheel'].forEach(event => {
            scrollContainer.addEventListener(event, () => {
                userIsInteracting = true;
                stopAutoScroll();
            });
        });

        // Resume after user interaction stops
        ['mouseleave', 'touchend', 'mouseup'].forEach(event => {
            scrollContainer.addEventListener(event, () => {
                userIsInteracting = false;
                scrollAmount = scrollContainer.scrollLeft; // Update position
                stopAutoScroll(); // Clear any existing interval
                startAutoScroll(); // Start a new one
            });
        });

        // Start the scrolling for the first time
        startAutoScroll();
    }
});
