// Load community events data and initialize the page
async function loadEvents() {
    try {
        const response = await fetch('assets/data/outreach-data.json');
        const data = await response.json();

        // Get all events from concerts array
        const allEvents = data.concerts || [];

        // Sort events into upcoming and past based on current date/time
        const { upcoming, past } = sortConcertsByDateTime(allEvents);

        displayEvents('upcoming-events', upcoming);
        displayEvents('past-events', past);
    } catch (error) {
        console.error('Error loading community events:', error);
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
        <div class="bg-white border border-gray-200 rounded-lg p-5 mb-3 hover:border-gray-400 transition-all">
            <div class="text-2xl font-bold text-gray-900 mb-1">${formattedDate}</div>
            ${event.time ? `<div class="text-base text-gray-600 mb-3">${event.time}</div>` : '<div class="mb-3"></div>'}
            <h3 class="text-lg font-semibold text-gray-800 mb-2">${event.name}</h3>
            <div class="flex flex-col gap-1.5 text-sm">
                <div class="flex items-center gap-2 text-gray-600">
                    <i data-lucide="map-pin" class="w-4 h-4 text-gray-500"></i>
                    <span>${event.location}</span>
                </div>
                ${typeHTML}
            </div>
        </div>
    `;
}

// Note: formatDate is now imported from utils.js

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
        if (panel.id === `${tabName}-events`) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    });
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();

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
