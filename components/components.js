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
            setupSignupModal();
        } catch (error) {
            console.error('Error loading footer:', error);
        }
    }

    // Footer "Join our mailing list" link: opens the Kit signup form in a modal
    function setupSignupModal() {
        const uid = 'c8c41a4f69';
        const link = document.getElementById('signup-link');
        const dialog = document.getElementById('signup-dialog');
        const content = document.getElementById('signup-content');

        function loadForm() {
            const script = document.createElement('script');
            script.async = true;
            script.dataset.uid = uid;
            script.src = `https://astrodon-quartet.kit.com/${uid}/index.js`;
            script.onerror = function() {
                content.innerHTML = '<p class="p-8 pr-12 text-gray-600">The signup form couldn\'t load. Please email us at <a href="mailto:contact@astrodonquartet.com" class="underline">contact@astrodonquartet.com</a> and we\'ll add you to the list.</p>';
            };
            content.replaceChildren(script);
        }

        link.addEventListener('click', function() {
            // Pages that already show the form inline jump to it and blink an outline around it
            const inlineForm = document.querySelector(`main [data-uid="${uid}"]`);
            if (inlineForm) {
                inlineForm.scrollIntoView({ block: 'center' });
                inlineForm.querySelector('input[type="email"], input[name="email_address"]')?.focus();
                // Removing the class and forcing a reflow restarts the animation on repeat clicks
                inlineForm.classList.remove('signup-highlight');
                void inlineForm.offsetWidth;
                inlineForm.classList.add('signup-highlight');
                return;
            }

            if (!content.querySelector(`[data-uid="${uid}"]`)) {
                loadForm();
            }
            dialog.showModal();
        });

        document.getElementById('signup-close').addEventListener('click', function() {
            dialog.close();
        });

        // Clicking the backdrop closes the modal
        dialog.addEventListener('click', function(event) {
            if (event.target === dialog) {
                dialog.close();
            }
        });
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
