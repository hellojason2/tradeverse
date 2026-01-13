document.addEventListener('DOMContentLoaded', () => {

    // 1. Mobile Menu Toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const navActions = document.querySelector('.nav-actions');

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            // In a real implementation we'd toggle a specific class for the mobile drawer
            // For now we just alert as placeholder or simple toggle logic
            // To make this functional we'd need more CSS for the mobile menu state
            // Let's just log it for now or assume CSS handles .active
            console.log('Mobile menu toggled');
        });
    }

    // 2. Navbar is permanently glassmorphic now (Aura Style)
    // No scroll listener needed for background change.


    // 3. Intersection Observer for Scroll Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // If the element is a stat counter, start counting
                if (entry.target.classList.contains('stat-number')) {
                    // Logic for number counting could go here
                }

                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Target elements to animate
    document.querySelectorAll('.feature-card, .pricing-card, .section-title, .market-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });

    // Add class for visible state in CSS via JS injection or predefined class
    // Let's add the listener to set the styles directly for simplicity
    const addVisibleStyles = (el) => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
    };

    // Override the observer callback slightly to use the function
    // Re-creating observer for clarity of "fade-in" logic
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                fadeObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card, .pricing-card, .section-title, .market-visual-container, .infra-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        fadeObserver.observe(el);
    });

    // 4. Hero Stats Counter Animation (Simple)
    const stats = document.querySelectorAll('.stat-number');
    stats.forEach(stat => {
        // Just a simple pop effect for now
        stat.style.opacity = 0;
        setTimeout(() => {
            stat.style.transition = 'opacity 1s';
            stat.style.opacity = 1;
        }, 1000);
    });

    // Orbit Animation Adjustments (Optional Dynamic Positioning)
    // No JS needed if CSS keyframes work well.
});
