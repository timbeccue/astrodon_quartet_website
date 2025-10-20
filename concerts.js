// Load concerts data and initialize the page
async function loadConcerts() {
    try {
        const response = await fetch('assets/data/concerts-data.json');
        const data = await response.json();

        // Get all concerts from either new format (concerts array) or old format (upcoming/past arrays)
        const allConcerts = data.concerts || [...(data.upcoming || []), ...(data.past || [])];

        // Sort concerts into upcoming and past based on current date/time
        const { upcoming, past } = sortConcertsByDateTime(allConcerts);

        displayConcerts('upcoming-concerts', upcoming);
        displayConcerts('past-concerts', past);
    } catch (error) {
        console.error('Error loading concerts:', error);
        document.getElementById('upcoming-concerts').innerHTML = '<p class="text-center text-gray-400 p-8 italic">Error loading concerts data.</p>';
        document.getElementById('past-concerts').innerHTML = '<p class="text-center text-gray-400 p-8 italic">Error loading concerts data.</p>';
    }
}

// Sort concerts into upcoming and past based on current date/time
function sortConcertsByDateTime(concerts) {
    const now = new Date();
    const upcoming = [];
    const past = [];

    concerts.forEach(concert => {
        const concertDateTime = parseConcertDateTime(concert.date, concert.time);

        if (concertDateTime >= now) {
            upcoming.push(concert);
        } else {
            past.push(concert);
        }
    });

    // Sort upcoming concerts chronologically (earliest first)
    upcoming.sort((a, b) => {
        const dateA = parseConcertDateTime(a.date, a.time);
        const dateB = parseConcertDateTime(b.date, b.time);
        return dateA - dateB;
    });

    // Sort past concerts reverse chronologically (most recent first)
    past.sort((a, b) => {
        const dateA = parseConcertDateTime(a.date, a.time);
        const dateB = parseConcertDateTime(b.date, b.time);
        return dateB - dateA;
    });

    return { upcoming, past };
}

// Parse concert date and time into a Date object
function parseConcertDateTime(dateString, timeString) {
    const date = new Date(dateString);

    if (timeString && timeString !== 'TBA') {
        // Parse time string (e.g., "3:00 PM", "11:00 AM")
        const timeMatch = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const meridiem = timeMatch[3].toUpperCase();

            // Convert to 24-hour format
            if (meridiem === 'PM' && hours !== 12) {
                hours += 12;
            } else if (meridiem === 'AM' && hours === 12) {
                hours = 0;
            }

            date.setHours(hours, minutes, 0, 0);
        } else {
            // If time format is not recognized, set to end of day to be safe
            date.setHours(23, 59, 59, 999);
        }
    } else {
        // If no time specified, set to end of day so it stays in upcoming until the day passes
        date.setHours(23, 59, 59, 999);
    }

    return date;
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

    // Create location HTML - hyperlink if Google Maps link exists
    const locationHTML = concert['google-maps']
        ? `<a href="${concert['google-maps']}" class="text-gray-600 hover:text-gray-900 underline" target="_blank" rel="noopener">${concert.location}</a>`
        : `<span>${concert.location}</span>`;

    // Create info button HTML - only for events with "info" property
    const infoButtonHTML = concert.info
        ? `<a href="${concert.info}" class="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors" target="_blank" rel="noopener">More Info <i data-lucide="external-link" class="w-3 h-3"></i></a>`
        : '';

    // Create note HTML - for special notes like "Contact us for tickets"
    const noteHTML = concert.note
        ? `<div class="mt-2 text-sm text-gray-500 italic">${concert.note}</div>`
        : '';

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
                    ${locationHTML}
                </div>
                ${programHTML}
                ${noteHTML}
                ${infoButtonHTML}
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
