// Load outreach events data and initialize the page
async function loadEvents() {
    try {
        const response = await fetch('assets/data/outreach-data.json');
        const data = await response.json();

        displayEvents('upcoming-events', data.upcoming);
        displayEvents('past-events', data.past);
    } catch (error) {
        console.error('Error loading outreach events:', error);
        document.getElementById('upcoming-events').innerHTML = '<p class="text-center text-gray-400 p-8 italic">Error loading events data.</p>';
        document.getElementById('past-events').innerHTML = '<p class="text-center text-gray-400 p-8 italic">Error loading events data.</p>';
    }
}

// Display events in the specified container
function displayEvents(containerId, events) {
    const container = document.getElementById(containerId);

    if (!events || events.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 p-8 italic">No events scheduled.</p>';
        return;
    }

    container.innerHTML = events.map(event => createEventCard(event)).join('');
}

// Create HTML for a single event card
function createEventCard(event) {
    const formattedDate = formatDate(event.date);
    const typeHTML = event.type ? `<div class="flex items-center gap-2 text-gray-600">
                    <i data-lucide="users" class="w-4 h-4 text-gray-500"></i>
                    <span>${event.type}</span>
                </div>` : '';

    return `
        <div class="bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:border-gray-400 transition-all">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">${event.name}</h3>
            <div class="flex flex-col gap-1.5 text-sm">
                <div class="flex items-center gap-2 text-gray-700">
                    <i data-lucide="calendar" class="w-4 h-4 text-gray-500"></i>
                    <span>${formattedDate}</span>
                    ${event.time ? `<span class="text-gray-400">•</span><i data-lucide="clock" class="w-4 h-4 text-gray-500"></i><span class="text-gray-600">${event.time}</span>` : ''}
                </div>
                <div class="flex items-center gap-2 text-gray-600">
                    <i data-lucide="map-pin" class="w-4 h-4 text-gray-500"></i>
                    <span>${event.location}</span>
                </div>
                ${typeHTML}
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

// Toggle section visibility
function toggleSection(sectionId, toggleButton) {
    const section = document.getElementById(sectionId);
    const icon = toggleButton.querySelector('span:last-child');
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

// Set initial state for past events based on screen size
function setInitialPastEventsState() {
    const pastSection = document.getElementById('past-events');
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
    loadEvents();

    document.getElementById('upcoming-toggle').addEventListener('click', function() {
        toggleSection('upcoming-events', this);
    });

    document.getElementById('past-toggle').addEventListener('click', function() {
        toggleSection('past-events', this);
    });

    // Set initial state for past events
    setInitialPastEventsState();

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            setInitialPastEventsState();
        }, 250);
    });

    // Initialize Lucide icons after content is loaded
    setTimeout(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, 100);
});
