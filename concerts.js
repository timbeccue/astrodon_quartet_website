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

// Note: parseConcertDateTime is now imported from utils.js

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
        <div class="bg-white border border-gray-200 rounded-lg p-5 mb-3 hover:border-gray-400 transition-all">
            <div class="text-2xl font-bold text-gray-900 mb-1">${formattedDate}</div>
            ${concert.time ? `<div class="text-base text-gray-600 mb-3">${concert.time}</div>` : '<div class="mb-3"></div>'}
            <h3 class="text-lg font-semibold text-gray-800 mb-2">${concert.name}</h3>
            <div class="flex flex-col gap-1.5 text-sm">
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

// Note: formatDate is now imported from utils.js

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

// Switch between tabs
function switchTab(tabName) {
    // Update tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        if (button.dataset.tab === tabName) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    // Update tab panels
    const tabPanels = document.querySelectorAll('.tab-panel');
    tabPanels.forEach(panel => {
        if (panel.id === `${tabName}-concerts`) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    });
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadConcerts();

    // Add click handlers to tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            switchTab(button.dataset.tab);
        });
    });

    // Initialize Lucide icons after content is loaded
    setTimeout(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, 100);
});
