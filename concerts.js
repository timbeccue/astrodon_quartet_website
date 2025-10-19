// Load concerts data and initialize the page
async function loadConcerts() {
    try {
        const response = await fetch('concerts-data.json');
        const data = await response.json();

        displayConcerts('upcoming-concerts', data.upcoming);
        displayConcerts('past-concerts', data.past);
    } catch (error) {
        console.error('Error loading concerts:', error);
        document.getElementById('upcoming-concerts').innerHTML = '<p class="text-center text-gray-400 p-8 italic">Error loading concerts data.</p>';
        document.getElementById('past-concerts').innerHTML = '<p class="text-center text-gray-400 p-8 italic">Error loading concerts data.</p>';
    }
}

// Display concerts in the specified container
function displayConcerts(containerId, concerts) {
    const container = document.getElementById(containerId);

    if (!concerts || concerts.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 p-8 italic">No concerts scheduled.</p>';
        return;
    }

    container.innerHTML = concerts.map(concert => createConcertCard(concert)).join('');
}

// Create HTML for a single concert card
function createConcertCard(concert) {
    const formattedDate = formatDate(concert.date);
    const programHTML = concert.program ? createProgramHTML(concert.program) : '';
    const linkHTML = concert.link ? `<a href="${concert.link}" class="inline-flex items-center gap-1 text-gray-900 no-underline text-sm font-medium hover:text-gray-500 transition-colors" target="_blank" rel="noopener"><i data-lucide="external-link" class="w-3.5 h-3.5"></i> More Info</a>` : '';

    return `
        <div class="bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:border-gray-400 transition-all">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">${concert.name}</h3>
            <div class="flex flex-col gap-1.5 text-sm">
                <div class="flex items-center gap-2 text-gray-700">
                    <i data-lucide="calendar" class="w-4 h-4 text-gray-500"></i>
                    <span>${formattedDate}</span>
                    ${concert.time ? `<span class="text-gray-400">•</span><i data-lucide="clock" class="w-4 h-4 text-gray-500"></i><span class="text-gray-600">${concert.time}</span>` : ''}
                </div>
                <div class="flex items-center gap-2 text-gray-600">
                    <i data-lucide="map-pin" class="w-4 h-4 text-gray-500"></i>
                    <span>${concert.location}</span>
                </div>
                ${programHTML}
                ${linkHTML ? `<div class="mt-1">${linkHTML}</div>` : ''}
            </div>
        </div>
    `;
}

// Format date string
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Create program HTML
function createProgramHTML(program) {
    if (!program || program.length === 0) return '';

    const programItems = program.map(item =>
        `<span class="text-gray-700">${item.composer}</span>`
    ).join('<span class="text-gray-400 mx-1">•</span>');

    return `<div class="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-gray-100">
                <i data-lucide="music" class="w-4 h-4 text-gray-500 flex-shrink-0"></i>
                <span class="text-sm">${programItems}</span>
            </div>`;
}

// Toggle section visibility
function toggleSection(sectionId, toggleButton) {
    const section = document.getElementById(sectionId);
    const icon = toggleButton.querySelector('.toggle-icon');
    const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';

    if (isExpanded) {
        section.style.maxHeight = '0';
        section.style.opacity = '0';
        section.style.overflow = 'hidden';
        toggleButton.setAttribute('aria-expanded', 'false');
        icon.textContent = '+';
    } else {
        section.style.maxHeight = 'calc(100vh - 250px)';
        section.style.opacity = '1';
        section.style.overflow = 'auto';
        toggleButton.setAttribute('aria-expanded', 'true');
        icon.textContent = '−';
    }
}

// Check if we're in mobile view
function isMobileView() {
    return window.innerWidth < 768; // md breakpoint
}

// Set initial state for past concerts based on screen size
function setInitialPastConcertsState() {
    const pastSection = document.getElementById('past-concerts');
    const pastToggle = document.getElementById('past-toggle');
    const icon = pastToggle.querySelector('span:last-child');

    if (isMobileView()) {
        // Collapse on mobile
        pastSection.style.maxHeight = '0';
        pastSection.style.opacity = '0';
        pastSection.style.overflow = 'hidden';
        pastToggle.setAttribute('aria-expanded', 'false');
        icon.textContent = '+';
    } else {
        // Expand on desktop
        pastSection.style.maxHeight = 'calc(100vh - 250px)';
        pastSection.style.opacity = '1';
        pastSection.style.overflow = 'auto';
        pastToggle.setAttribute('aria-expanded', 'true');
        icon.textContent = '−';
    }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadConcerts();

    document.getElementById('upcoming-toggle').addEventListener('click', function() {
        toggleSection('upcoming-concerts', this);
    });

    document.getElementById('past-toggle').addEventListener('click', function() {
        toggleSection('past-concerts', this);
    });

    // Set initial state for past concerts
    setInitialPastConcertsState();

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            setInitialPastConcertsState();
        }, 250);
    });

    // Initialize Lucide icons after content is loaded
    setTimeout(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, 100);
});
