/**
 * SKRYPT DO POBIERANIA WYDARZEŃ Z FACEBOOKA
 * 
 * INSTRUKCJA:
 * 1. Wejdź na stronę z wydarzeniami.
 * 2. Otwórz Konsolę (F12).
 * 3. Wklej kod i ENTER.
 * 4. Dane w schowku -> Wklej do Generatora.
 */

(async function() {
    console.log("🚀 Rozpoczynam pobieranie wydarzeń...");

    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const events = [];

    // --- KONFIGURACJA I STAŁE ---
    const KEYWORDS_TO_CUT = [
        "proponowane wydarzenia", "popularne wśród znajomych", "goście", 
        "poznaj organizatora", "transparentność wydarzeń", "informacje o wydarzeniu",
        "szczegóły", "pokaż wszystkich", "pokaż mniej", "zaproszenie", "udostępnij"
    ];

    const EXCLUDED_TITLES = ["WARSZTATY", "KURS", "ZAJĘCIA"];

    // --- HELPERY ---
    function parseFBDate(text) {
        if (!text) return null;
        text = text.toUpperCase();
        const now = new Date();
        const currentYear = now.getFullYear();

        // Relatywne
        if (text.includes('DZISIAJ')) return now;
        if (text.includes('JUTRO')) { const d = new Date(now); d.setDate(d.getDate() + 1); return d; }
        if (text.includes('POJUTRZE')) { const d = new Date(now); d.setDate(d.getDate() + 2); return d; }

        // Miesiące
        const months = {'STY':0, 'LUT':1, 'MAR':2, 'KWI':3, 'MAJ':4, 'CZE':5, 'LIP':6, 'SIE':7, 'WRZ':8, 'PAŹ':9, 'PAZ':9, 'LIS':10, 'GRU':11};
        
        // Regex: "20 PAŹ" lub "PT., 20 PAŹ" lub "20.10"
        const regex = /(\d{1,2})\s+(STY|LUT|MAR|KWI|MAJ|CZE|LIP|SIE|WRZ|PAŹ|PAZ|LIS|GRU)/;
        const match = text.match(regex);
        if (match) {
             const day = parseInt(match[1]);
             const month = months[match[2]];
             const d = new Date(currentYear, month, day);
             
             // Korekta roku: jeśli data jest w przeszłości o więcej niż 2 miesiące, zakładamy przyszły rok
             // (np. skanujemy w Grudniu event na Styczeń -> Styczeń < Grudzień, więc year++)
             if (d < new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)) { 
                 d.setFullYear(currentYear + 1);
             }
             return d;
        }

        // Format DD.MM
        const regexDot = /(\d{1,2})\.(\d{1,2})/;
        const matchDot = text.match(regexDot);
        if (matchDot) {
             const day = parseInt(matchDot[1]);
             const month = parseInt(matchDot[2]) - 1;
             const d = new Date(currentYear, month, day);
             if (d < new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)) d.setFullYear(currentYear + 1);
             return d;
        }

        return null;
    }

    function cleanDescription(text) {
        let cleanText = text;
        const lowerText = cleanText.toLowerCase();
        let cutIndex = cleanText.length;
        
        KEYWORDS_TO_CUT.forEach(kw => {
            const idx = lowerText.indexOf(kw.toLowerCase());
            if (idx !== -1 && idx < cutIndex) cutIndex = idx;
        });
        
        return cleanText.substring(0, cutIndex).trim();
    }

    function copyToClipboard(text) {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }

    function finalize(eventsList) {
        if (eventsList.length > 0) {
            const json = JSON.stringify(eventsList, null, 2);
            copyToClipboard(json);
            console.log(`✅ Znaleziono ${eventsList.length} wydarzeń!`);
            console.table(eventsList);
            alert(`✅ Sukces! Skopiowano ${eventsList.length} wydarzeń do schowka.`);
        } else {
            console.warn("⚠️ Nie znaleziono wydarzeń.");
            alert("⚠️ Nie znaleziono wydarzeń. Przewiń stronę i spróbuj ponownie.");
        }
    }

    // ---------------------------------------------------------
    // TRYB: POJEDYNCZE WYDARZENIE
    // ---------------------------------------------------------
    const isSingleEventPage = /\/events\/\d+/.test(window.location.href);
    
    if (isSingleEventPage) {
        console.log("🔍 Tryb: Pojedyncze wydarzenie");
        
        let container = document.querySelector('div[role="main"]');
        const h1 = container ? container.querySelector('h1') : document.querySelector('h1');
        
        if (!container && h1) container = h1.parentElement.parentElement.parentElement;
        if (!container) container = document.body;

        if (container) {
            // Expand
            container.querySelectorAll('div[role="button"], span[role="button"]').forEach(btn => {
                if (btn.innerText.includes("Wyświetl więcej") || btn.innerText.includes("See more")) try { btn.click(); } catch(e){}
            });
            await sleep(1000);

            // Title
            let title = h1 ? h1.innerText : "Bez tytułu";
            if (["Wydarzenia", "Events"].includes(title)) {
                 const realTitle = container.querySelector('h1') || container.querySelector('span[style*="font-size: 20"]');
                 if(realTitle) title = realTitle.innerText;
            }

            // Description extraction
            let detailsText = "";
            const xpath = "//*[contains(text(), 'Szczegółowe informacje') or contains(text(), 'Details')]";
            const detailsHeaderSnap = document.evaluate(xpath, container, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            
            if (detailsHeaderSnap.snapshotLength > 0) {
                const node = detailsHeaderSnap.snapshotItem(0);
                const wrapper = node.closest('div.x1yztbdb') || node.closest('div[class*="x1"]');
                if (wrapper) detailsText = wrapper.innerText;
            }
            if (detailsText.length < 50) detailsText = container.innerText; // Fallback

            // Analiza linii dla Daty i Lokalizacji
            const lines = container.innerText.split('\n').filter(l => l.trim().length > 1);
            let date = "";
            let location = "";

            // 1. DATA - PRIORYTETY
            // A. Selektory (najdokładniejsze)
            const dateSelectors = [
                'div[data-testid="event-permalink-details"]',
                'div#event_time_info',
                'div.x1e56ztr.x1xmf6yo',
                'div[class*="x1e56ztr"][class*="x1xmf6yo"]', 
                'span.x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1n2onr6.x1603h9y.x1s688f.x5n08af',
                'div.xyamay9.x1n2onr6.x1l90r2v.x1d52u69'
            ];

            for (const sel of dateSelectors) {
                const el = document.querySelector(sel);
                if (el && el.innerText.trim().length > 0) {
                     date = el.innerText.trim();
                     console.log('Date found via selector:', sel);
                     break;
                }
            }

            // B. Pętla po liniach (fallback)
            for(let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line === title || KEYWORDS_TO_CUT.some(k => line.toLowerCase().includes(k))) continue;
                
                // DATA Fallback
                if (!date) {
                    if (parseFBDate(line)) {
                        date = line;
                    } 
                    else if (/^\d{1,2}$/.test(line.trim()) && i+1 < lines.length) {
                        const potentialDate = line + " " + lines[i+1];
                        if (parseFBDate(potentialDate)) {
                            date = potentialDate;
                        }
                    }
                }

                // LOKALIZACJA
                // Szukamy linii z miastem lub ulicą
                if (!location && !date && (line.includes(',') || line.includes('ul.') || /Katowice|Gliwice|Sosnowiec|Bytom|Chorzów|Świętochłowice|Bielsko/i.test(line))) {
                    if (!line.toLowerCase().includes("wydarzenie") && line.length < 150) {
                        location = line;
                    }
                }
            }
            
            if (!date && lines.length > 0) date = lines[0]; // Desperate fallback

            if (!EXCLUDED_TITLES.some(t => title.toUpperCase().includes(t))) {
                events.push({
                    url: window.location.href.split('?')[0],
                    rawDate: date,
                    title: title,
                    location: location || "Adres w opisie",
                    description: cleanDescription(detailsText)
                });
            }
        }
        
        finalize(events);
        return; 
    }


    // ---------------------------------------------------------
    // TRYB: LISTA WYDARZEŃ
    // ---------------------------------------------------------
    console.log("🔍 Tryb: Lista wydarzeń");

    const today = new Date();
    today.setHours(0,0,0,0);
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + (7 - today.getDay()) % 7); // do najbliższej niedzieli (0-6)
    nextSunday.setHours(23, 59, 59, 999);

    const links = Array.from(document.querySelectorAll('a[href*="/events/"]'));
    const uniqueLinks = new Set();
    
    links.forEach(link => {
        const href = link.href.split('?')[0];
        if(uniqueLinks.has(href) || !href.match(/\/events\/\d+/)) return;
        uniqueLinks.add(href);

        let container = link.closest('div[style*="border-radius"], div[class*="x1"], div[role="article"]');
        if(!container) container = link.parentElement.parentElement.parentElement;
        if (container) {
            if (container.querySelectorAll('a[href*="/events/"]').length > 2) container = link.parentElement.parentElement;

            const textContent = container.innerText;
            const lines = textContent.split('\n').filter(l => l.trim().length > 0);
            
            let dateStr = "";
            let title = "";
            let location = "";

            const isDateLine = (txt) => parseFBDate(txt) !== null;

            if (isDateLine(lines[0])) {
                dateStr = lines[0];
                title = lines[1] || "";
                location = lines[2] || "";
            } else if (isDateLine(lines[1])) {
                title = lines[0];
                dateStr = lines[1];
                location = lines[2] || "";
            } else {
                title = link.innerText;
                dateStr = lines.find(l => isDateLine(l)) || "";
            }

            if(dateStr.toUpperCase().includes("INTERESUJE")) {
                 dateStr = lines.find(l => isDateLine(l)) || dateStr;
            }
            if (!title) title = "Bez tytułu";

            const eventDate = parseFBDate(dateStr);
            if (eventDate) {
                const checkDate = new Date(eventDate);
                checkDate.setHours(0,0,0,0);
                if (checkDate < today || checkDate > nextSunday) return;
            } else {
                return;
            }

            if (EXCLUDED_TITLES.some(t => title.toUpperCase().includes(t))) return;

            console.log(`➕ Dodano: ${title}`);
            events.push({
                url: href,
                rawDate: dateStr,
                title: title,
                location: location,
                description: textContent
            });
        }
    });

    finalize(events);

})();
