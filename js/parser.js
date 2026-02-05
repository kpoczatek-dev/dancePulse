import { parsujDateFB, formatujDatePL } from './utils.js';

/**
 * Parsuje surowy tekst JSON ze schowka i zwraca poprawne obiekty wydarzeń.
 * Przeprowadza deduplikację, walidację dat (zakres 14 dni) oraz sortowanie.
 * @param {string} jsonText - Tekst JSON skopiowany przez skraper
 * @returns {Object} Obiekt zawierający { events: [], skippedReasons: [] }
 */
export function parseClipboardData(jsonText) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 14);
    maxDate.setHours(23, 59, 59, 999);

    let events;
    try {
        events = JSON.parse(jsonText);
    } catch (e) {
        throw new Error("Nieprawidłowy JSON.");
    }

    if (!Array.isArray(events)) {
        throw new Error("To nie jest tablica wydarzeń.");
    }

    const processedUrls = new Set();
    const uniqueRawEvents = [];
    const skippedReasons = [];

    // Deduplicate raw input by URL
    events.forEach(ev => {
         if(!ev.url) return;
         if(processedUrls.has(ev.url)) return; 
         processedUrls.add(ev.url);
         uniqueRawEvents.push(ev);
    });

    const validatedEvents = [];

    uniqueRawEvents.forEach(ev => {
        const candidates = [];
        // Prioritize rawDate as it might be ISO now
        const sources = [ev.rawDate, ev.description, ev.title];
        
        sources.forEach(src => {
            const d = parsujDateFB(src);
            if (d) candidates.push(d);
        });

        // Filter dates >= today
        const validCandidates = candidates.filter(d => d >= today);
        validCandidates.sort((a, b) => a - b);

        if (validCandidates.length === 0) {
             skippedReasons.push(`"${ev.title}": Nie rozpoznano daty (Tekst: "${ev.rawDate || 'brak'}")`);
             return; 
        }

        const parsedDate = validCandidates[0];

        if (parsedDate > maxDate) {
            skippedReasons.push(`"${ev.title}": Data poza zakresem 14 dni (${formatujDatePL(parsedDate)})`);
            return;
        }
        
        // Success
        ev.parsedDate = parsedDate;
        validatedEvents.push(ev);
    });

    // SMART SORTING: Sort by date
    validatedEvents.sort((a, b) => a.parsedDate - b.parsedDate);

    return {
        events: validatedEvents,
        skippedReasons
    };
}
