// Component loader for navbar and footer
(function() {
    // Get current page name from URL
    function getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '') || 'index';
        return page;
    }

    // Load navbar
    async function loadNavbar() {
        try {
            const response = await fetch('components/navbar.html');
            const html = await response.text();
            document.body.insertAdjacentHTML('afterbegin', html);

            // Highlight current page
            const currentPage = getCurrentPage();
            const links = document.querySelectorAll('.nav-link');
            links.forEach(link => {
                const linkPage = link.getAttribute('data-page');
                if (linkPage === currentPage) {
                    link.classList.remove('text-gray-500');
                    link.classList.add('text-gray-900', 'font-medium');
                }
            });

            // Mobile menu toggle functionality
            const mobileMenuButton = document.getElementById('mobile-menu-button');
            const mobileMenu = document.getElementById('mobile-menu');
            const hamburgerIcon = document.getElementById('hamburger-icon');
            const closeIcon = document.getElementById('close-icon');

            if (mobileMenuButton && mobileMenu) {
                mobileMenuButton.addEventListener('click', function() {
                    // Toggle menu visibility
                    mobileMenu.classList.toggle('hidden');

                    // Toggle icons
                    hamburgerIcon.classList.toggle('hidden');
                    closeIcon.classList.toggle('hidden');
                });
            }
        } catch (error) {
            console.error('Error loading navbar:', error);
        }
    }

    // Load footer
    async function loadFooter() {
        try {
            const response = await fetch('components/footer.html');
            const html = await response.text();
            document.body.insertAdjacentHTML('beforeend', html);
        } catch (error) {
            console.error('Error loading footer:', error);
        }
    }

    // Load components when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            loadNavbar();
            loadFooter();
        });
    } else {
        loadNavbar();
        loadFooter();
    }
})();
