// Shared utility functions for the Astrodon Quartet website

/**
 * Format a date string (YYYY-MM-DD) for display
 * Parses date components to avoid UTC timezone issues
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date string (e.g., "November 10, 2025")
 */
function formatDate(dateString) {
    // Parse the date components to avoid UTC timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    // Create date in local timezone (month is 0-indexed)
    const date = new Date(year, month - 1, day);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Parse concert/event date and time into a Date object
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} timeString - Time string (e.g., "3:00 PM", "11:00 AM")
 * @returns {Date} Date object with the specified date and time
 */
function parseConcertDateTime(dateString, timeString) {
    // Parse date components to create in local timezone
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

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

/**
 * Sort concerts/events into upcoming and past based on current date/time
 * @param {Array} events - Array of event objects with date and optional time properties
 * @returns {Object} Object with upcoming and past arrays
 */
function sortConcertsByDateTime(events) {
    const now = new Date();
    const upcoming = [];
    const past = [];

    events.forEach(event => {
        const eventDateTime = parseConcertDateTime(event.date, event.time);

        if (eventDateTime >= now) {
            upcoming.push(event);
        } else {
            past.push(event);
        }
    });

    // Sort upcoming events chronologically (earliest first)
    upcoming.sort((a, b) => {
        const dateA = parseConcertDateTime(a.date, a.time);
        const dateB = parseConcertDateTime(b.date, b.time);
        return dateA - dateB;
    });

    // Sort past events reverse chronologically (most recent first)
    past.sort((a, b) => {
        const dateA = parseConcertDateTime(a.date, a.time);
        const dateB = parseConcertDateTime(b.date, b.time);
        return dateB - dateA;
    });

    return { upcoming, past };
}
