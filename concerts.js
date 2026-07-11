// Load concerts data and initialize the page
async function loadConcerts() {
    try {
        const response = await fetch('assets/data/concerts-data.json');
        const data = await response.json();

        // Get all concerts from either new format (concerts array) or old format (upcoming/past arrays)
        const allConcerts = data.concerts || [...(data.upcoming || []), ...(data.past || [])];

        // Sort concerts into upcoming and past based on current date/time
        const { upcoming, past } = sortConcertsByDateTime(allConcerts);

        displayConcerts('upcoming-concerts', upcoming, { featureFirst: true });
        displayConcerts('past-concerts', past);

        // Add MusicEvent structured data for search engines (from utils.js)
        injectConcertSchema(upcoming);
    } catch (error) {
        console.error('Error loading concerts:', error);
        document.getElementById('upcoming-concerts').innerHTML = '<p class="text-center text-gray-400 p-8 italic">Error loading concerts data.</p>';
        document.getElementById('past-concerts').innerHTML = '<p class="text-center text-gray-400 p-8 italic">Error loading concerts data.</p>';
    }
}

// Note: sortConcertsByDateTime and parseConcertDateTime are now imported from utils.js

// Display concerts in the specified container, grouped by month.
// options.featureFirst renders the first concert as a highlighted "Next Concert" card.
function displayConcerts(containerId, concerts, options = {}) {
    const container = document.getElementById(containerId);

    if (!concerts || concerts.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 p-8 italic">No concerts scheduled.</p>';
        return;
    }

    let html = '';
    let list = concerts;

    if (options.featureFirst) {
        html += createConcertCard(concerts[0], { featured: true });
        list = concerts.slice(1);
    }

    let currentMonth = '';
    list.forEach(concert => {
        const monthLabel = formatMonthYear(concert.date);
        if (monthLabel !== currentMonth) {
            currentMonth = monthLabel;
            html += `<h2 class="text-xl font-bold text-gray-900 mt-8 mb-3 first:mt-0 pb-1 border-b border-gray-200">${monthLabel}</h2>`;
        }
        html += createConcertCard(concert);
    });

    container.innerHTML = html;
}

// Format a date string as a month heading (e.g., "July 2026")
function formatMonthYear(dateString) {
    const [year, month] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Admission badge styles, keyed by the optional "admission" field in concerts-data.json
const ADMISSION_BADGES = {
    free: { label: 'Free admission', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    tickets: { label: 'Ticketed', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
    rsvp: { label: 'RSVP required', classes: 'bg-blue-50 text-blue-700 border-blue-200' }
};

// Assumed concert length for calendar events
const CONCERT_DURATION_MINUTES = 90;

function pad2(n) {
    return String(n).padStart(2, '0');
}

// Get start/end for calendar links. Times are "floating" (no timezone) so
// calendar apps read them as venue-local time — correct for attendees.
// Falls back to an all-day event when the time is missing or unparseable.
function getCalendarEventTimes(concert) {
    const hasTime = concert.time && /(\d{1,2}):(\d{2})\s*(AM|PM)/i.test(concert.time);

    if (!hasTime) {
        const [year, month, day] = concert.date.split('-').map(Number);
        const nextDay = new Date(year, month - 1, day + 1);
        return {
            allDay: true,
            start: concert.date.replace(/-/g, ''),
            end: `${nextDay.getFullYear()}${pad2(nextDay.getMonth() + 1)}${pad2(nextDay.getDate())}`
        };
    }

    const start = parseConcertDateTime(concert.date, concert.time);
    const end = new Date(start.getTime() + CONCERT_DURATION_MINUTES * 60000);
    const stamp = d => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(d.getHours())}${pad2(d.getMinutes())}00`;
    return { allDay: false, start: stamp(start), end: stamp(end) };
}

function createGoogleCalendarUrl(concert, times) {
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: `${concert.name} — Astrodon Quartet`,
        dates: `${times.start}/${times.end}`,
        location: concert.location
    });
    const details = [concert.description, concert.note, concert.info].filter(Boolean).join('\n');
    if (details) params.set('details', details);
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Escape text for iCalendar fields per RFC 5545
function escapeIcsText(text) {
    return String(text)
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
}

function createIcsDataUri(concert, times) {
    const now = new Date();
    const dtstamp = `${now.getUTCFullYear()}${pad2(now.getUTCMonth() + 1)}${pad2(now.getUTCDate())}` +
        `T${pad2(now.getUTCHours())}${pad2(now.getUTCMinutes())}${pad2(now.getUTCSeconds())}Z`;
    const slug = concert.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const description = [concert.description, concert.note, concert.info]
        .filter(Boolean).map(escapeIcsText).join('\\n');

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Astrodon Quartet//Concerts//EN',
        'BEGIN:VEVENT',
        `UID:${concert.date}-${slug}@astrodonquartet.com`,
        `DTSTAMP:${dtstamp}`,
        times.allDay ? `DTSTART;VALUE=DATE:${times.start}` : `DTSTART:${times.start}`,
        times.allDay ? `DTEND;VALUE=DATE:${times.end}` : `DTEND:${times.end}`,
        `SUMMARY:${escapeIcsText(`${concert.name} — Astrodon Quartet`)}`,
        `LOCATION:${escapeIcsText(concert.location)}`
    ];
    if (description) lines.push(`DESCRIPTION:${description}`);
    if (concert.info) lines.push(`URL:${concert.info}`);
    lines.push('END:VEVENT', 'END:VCALENDAR');

    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(lines.join('\r\n'));
}

// "Add to calendar" icon button with a small dropdown — only for concerts
// that haven't happened yet. Toggle/close behavior is handled by the
// delegated listeners set up in DOMContentLoaded.
function createCalendarMenuHTML(concert) {
    if (parseConcertDateTime(concert.date, concert.time) < new Date()) return '';

    const times = getCalendarEventTimes(concert);
    // Escape & so URLSearchParams output is safe inside an HTML attribute
    const googleUrl = createGoogleCalendarUrl(concert, times).replace(/&/g, '&amp;');
    const icsUri = createIcsDataUri(concert, times);

    return `<div class="relative flex-shrink-0">
                <button type="button" class="calendar-menu-toggle p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" aria-label="Add to calendar" title="Add to calendar" aria-haspopup="true" aria-expanded="false">
                    <i data-lucide="calendar-plus" class="w-5 h-5"></i>
                </button>
                <div class="calendar-menu hidden absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                    <a href="${googleUrl}" target="_blank" rel="noopener" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Google Calendar</a>
                    <a href="${icsUri}" download="astrodon-quartet-${concert.date}.ics" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Apple / Outlook (.ics)</a>
                </div>
            </div>`;
}

// Create HTML for a single concert card
function createConcertCard(concert, { featured = false } = {}) {
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

    // Create partner HTML - partnership credit with optional logo
    const partnerHTML = concert.partner
        ? `<div class="flex items-center gap-2 mt-2">
                ${concert.partner.logo ? `<img src="${concert.partner.logo}" alt="" class="w-10 h-10 object-contain flex-shrink-0">` : ''}
                <span class="text-sm text-gray-500 italic">${concert.partner.text}</span>
            </div>`
        : '';

    const calendarHTML = createCalendarMenuHTML(concert);

    const badge = ADMISSION_BADGES[concert.admission];
    const badgeHTML = badge
        ? `<span class="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${badge.classes}">${badge.label}</span>`
        : '';

    const descriptionHTML = concert.description
        ? `<p class="text-sm text-gray-600 mb-2 max-w-prose">${concert.description}</p>`
        : '';

    const cardClasses = featured
        ? 'bg-white border-2 border-gray-900 rounded-lg p-6 md:p-8 mb-8'
        : 'bg-white border border-gray-200 rounded-lg p-5 mb-3 hover:border-gray-400 transition-all';
    const eyebrowHTML = featured
        ? '<div class="text-xs font-bold tracking-widest uppercase text-gray-500 mb-3">Next Concert</div>'
        : '';
    const dateClasses = featured ? 'text-3xl' : 'text-2xl';

    return `
        <div class="${cardClasses}">
            ${eyebrowHTML}
            <div class="flex items-start justify-between gap-3 mb-1">
                <div class="${dateClasses} font-bold text-gray-900">${formattedDate}</div>
                <div class="flex items-center gap-2">
                    ${badgeHTML}
                    ${calendarHTML}
                </div>
            </div>
            ${concert.time ? `<div class="text-base text-gray-600 mb-3">${concert.time}</div>` : '<div class="mb-3"></div>'}
            <h3 class="text-lg font-semibold text-gray-800 mb-2">${concert.name}</h3>
            ${descriptionHTML}
            <div class="flex flex-col gap-1.5 text-sm">
                <div class="flex items-center gap-2 text-gray-600">
                    <i data-lucide="map-pin" class="w-4 h-4 text-gray-500"></i>
                    ${locationHTML}
                </div>
                ${programHTML}
                ${noteHTML}
                ${partnerHTML}
                ${infoButtonHTML}
            </div>
        </div>
    `;
}

// Note: formatDate is now imported from utils.js

// Create program HTML. Items with a "work" title render as a vertical list
// ("Composer — Work"); composer-only programs stay as a compact inline row.
function createProgramHTML(program) {
    if (!program || program.length === 0) return '';

    if (program.some(item => item.work)) {
        const rows = program.map(item =>
            `<li class="text-gray-700">${item.composer}${item.work ? ` — <span class="italic">${item.work}</span>` : ''}</li>`
        ).join('');

        return `<div class="flex items-start gap-1 mt-1.5 pt-1.5 border-t border-gray-100">
                    <i data-lucide="music" class="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5"></i>
                    <ul class="text-sm flex flex-col gap-0.5">${rows}</ul>
                </div>`;
    }

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

// Close every open add-to-calendar dropdown
function closeCalendarMenus() {
    document.querySelectorAll('.calendar-menu:not(.hidden)').forEach(menu => {
        menu.classList.add('hidden');
        menu.previousElementSibling.setAttribute('aria-expanded', 'false');
    });
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadConcerts();

    // Add-to-calendar dropdowns: delegated so they survive card re-renders
    document.addEventListener('click', (e) => {
        const toggle = e.target.closest('.calendar-menu-toggle');
        const menu = toggle ? toggle.nextElementSibling : null;
        const wasOpen = menu && !menu.classList.contains('hidden');

        closeCalendarMenus();

        if (menu && !wasOpen) {
            menu.classList.remove('hidden');
            toggle.setAttribute('aria-expanded', 'true');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeCalendarMenus();
    });

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
