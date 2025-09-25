document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Fade-in on Scroll Animation ---
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


    // --- 2. Enhanced Auto-scrolling for Premium Features Section ---
    const scrollContainer = document.querySelector('.scroll-container');
    if (scrollContainer) {
        let scrollAmount = 0;
        let userIsInteracting = false;
        let autoScrollInterval;

        // Functions to start and stop auto-scrolling
        const startAutoScroll = () => {
            autoScrollInterval = setInterval(() => {
                if (!userIsInteracting) {
                    const scrollWidth = scrollContainer.scrollWidth;
                    
                    if (scrollAmount >= scrollWidth / 2) {
                        scrollAmount = 0;
                    }
                    scrollContainer.scrollTo({ left: scrollAmount, behavior: 'auto' });
                    scrollAmount += 0.5; // Scroll speed
                }
            }, 20); // Interval
        };

        const stopAutoScroll = () => {
            clearInterval(autoScrollInterval);
        };

        // Pause on any user interaction
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
                // Update scrollAmount to current position before restarting
                scrollAmount = scrollContainer.scrollLeft;
                stopAutoScroll(); // Clear any existing interval
                startAutoScroll(); // Start a new one
            });
        });

        // Start the scrolling for the first time
        startAutoScroll();
    }
});
