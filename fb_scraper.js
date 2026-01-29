/**
 * SKRYPT DO POBIERANIA WYDARZEŃ Z FACEBOOKA
 * 
 * INSTRUKCJA:
 * 1. Wejdź na stronę z wydarzeniami (np. zakładka "Wydarzenia" na fanpage'u lub lista wydarzeń).
 * 2. Otwórz Konsolę Deweloperską (F12 -> zakładka Console).
 * 3. Wklej cały poniższy kod i naciśnij ENTER.
 * 4. Pobrane dane zostaną skopiowane do schowka.
 * 5. Wklej je w polu "Import z Facebooka" w Generatorze Imprez.
 */

(async function() {
    console.log("🚀 Rozpoczynam pobieranie wydarzeń...");

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    const events = [];
    
    // ---------------------------------------------------------
    // TRYB: POJEDYNCZE WYDARZENIE (Priorytet, jeśli jesteśmy na stronie wydarzenia)
    // ---------------------------------------------------------
    const isSingleEventPage = /\/events\/\d+/.test(window.location.href);
    
    if (isSingleEventPage) {
        console.log("🔍 Wykryto stronę pojedynczego wydarzenia. Próba pobrania szczegółów...");
        
        // Szukamy nagłówka H1 TYLKO w obszarze main (żeby ominąć logo z paska "Wydarzenia")
        const main = document.querySelector('div[role="main"]');
        if (!main) {
             console.error("❌ Nie znaleziono kontenera main. FB zmienił strukturę?");
        }

        const h1 = main ? main.querySelector('h1') : (document.querySelector('h1') || document.querySelector('h2'));
        
        if (h1) {
            let title = h1.innerText;
            // Robust Title Check
            if (title === "Wydarzenia" || title === "Events" || title === "Nadchodzące wydarzenia") {
                 const realTitle = document.querySelector('div[role="main"] h1') || document.querySelector('div[role="main"] span[style*="font-size: 20"]');
                 if(realTitle) title = realTitle.innerText;
            }

            // Widen container back to body to ensure we don't miss content, 
            // relying on cut-logic to remove sidebar garbage.
            // UPDATE: body is too wide (grabs sidebar bio). Restrict to H1's ancestry.
            let container = document.querySelector('div[role="main"]');
            
            if (!container && h1) {
                 // Fallback: 3 levels up from H1
                 container = h1.parentElement.parentElement.parentElement;
            }

            if (!container) container = document.body; // Ultimate fallback (risky but needed if structure passed main)

            if (container) {
                // Expanding logic...
                const expandButtons = container.querySelectorAll('div[role="button"], span[role="button"]');
                let clicked = false;
                expandButtons.forEach(btn => {
                    if (btn.innerText.includes("Wyświetl więcej") || btn.innerText.includes("See more")) {
                        try { 
                            btn.click(); 
                            clicked = true;
                            // console.log("🖱️ Kliknięto 'Wyświetl więcej'...");
                        } catch(e) {}
                    }
                });
                
                if (clicked) {
                    await sleep(1500);
                }

                // Szukamy sekcji "Szczegółowe informacje"
                let detailsText = "";
                // Use .// to search relative to container if possible, but XPath 'contains' is global usually?
                // Let's stick to global XPath but verify it's inside container
                const xpath = "//*[contains(text(), 'Szczegółowe informacje') or contains(text(), 'Details')]";
                const detailsHeaderSnap = document.evaluate(xpath, container, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                
                let detailsHeader = null;
                // Find first header within container
                for(let i=0; i<detailsHeaderSnap.snapshotLength; i++) {
                    const node = detailsHeaderSnap.snapshotItem(i);
                    if (container.contains(node)) {
                        detailsHeader = node;
                        break;
                    }
                }

                if (detailsHeader) {
                    // Try to get content from siblings
                    let contentNode = detailsHeader.nextElementSibling;
                    if (!contentNode || contentNode.innerText.length < 10) contentNode = detailsHeader.parentElement.nextElementSibling;
                    if (!contentNode || contentNode.innerText.length < 10) contentNode = detailsHeader.parentElement.parentElement.nextElementSibling;
                    
                    // Wrapper strategy
                    if (!contentNode || contentNode.innerText.length < 10) {
                        const wrapper = detailsHeader.closest('div.x1yztbdb') || detailsHeader.closest('div[class*="x1"]') ;
                        if (wrapper) detailsText = wrapper.innerText;
                    } else {
                        detailsText = contentNode.innerText;
                    }
                }
                
                // FALLBACK: Jeśli detailsText jest pusty/mały, skanuj div[dir="auto"] (typowe dla treści posta) TYLKO W KONTENERZE
                if (detailsText.length < 50) {
                    console.log("⚠️ Details section weak. Scanning for post content paragraphs in container...");
                    const paragraphs = container.querySelectorAll('div[dir="auto"]');
                    let paraText = "";
                    paragraphs.forEach(p => {
                        // Zbieramy akapity, które wyglądają na treść (nie są puste, nie są datami)
                        if (p.innerText.length > 20) {
                             paraText += "\n" + p.innerText;
                        }
                    });
                    if (paraText.length > detailsText.length) detailsText = paraText;
                }

                const text = container.innerText;
                
                // DATA EXTRACTION STRATEGY:
                // 1. Use 'text' (full container content) to find Date and Location (header info).
                // 2. Use 'detailsText' (specific section) for the 'description' field to avoid noise.
                
                const lines = text.split('\n').filter(l => l.trim().length > 0);
                
                let date = "";
                let location = "";
                
                // Regex daty: szukamy formatów typu "SOB., 21 PAŹ" albo "PIĄTEK, 15:00" ORAZ "JUTRO", "DZISIAJ"
                const dateRegex = /(\d{1,2}\s+(STY|LUT|MAR|KWI|MAJ|CZE|LIP|SIE|WRZ|PAŹ|LIS|GRU))|(PON|WTO|ŚRO|CZW|PIĄ|SOB|NIE)|JUTRO|DZISIAJ|POJUTRZE/i;
                
                for(let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (line === title) continue;
                    if (line.includes("Zaproszenie") || line.includes("Szczegóły") || line.includes("Udostępnij")) continue;
                    
                    // 1. Standardowy regex (w jednej linii)
                    if (!date && dateRegex.test(line) && line.length < 50) {
                        date = line;
                        continue;
                    }

                    // 2. Data w dwóch liniach (np. "31" [enter] "STY")
                    // Sprawdzamy czy obecna linia to liczba (1-31)
                    if (!date && /^\d{1,2}$/.test(line.trim())) {
                        // Sprawdzamy czy następna linia to miesiąc
                        if (i + 1 < lines.length) {
                            const nextLine = lines[i+1].trim().toUpperCase();
                            if (/^(STY|LUT|MAR|KWI|MAJ|CZE|LIP|SIE|WRZ|PAŹ|LIS|GRU)/.test(nextLine)) {
                                date = line + " " + nextLine;
                                i++; // Przeskocz kolejną linię bo ją zużyliśmy
                                continue;
                            }
                        }
                    }
                    
                    // Szukamy lokalizacji
                    if (!location && (line.includes(',') || line.includes('ul.') || /Katowice|Gliwice|Sosnowiec|Bytom|Chorzów|Świętochłowice/i.test(line)) && line.length < 150) {
                        if (!line.toLowerCase().includes("wydarzenie") && !line.toLowerCase().includes("organizator")) {
                             location = line;
                        }
                    }
                }
                
                // Fallback daty
                if (!date && lines.length > 0) date = lines[0];

                const isExcluded = title.toUpperCase().includes("WARSZTATY") || title.toUpperCase().includes("KURS") || title.toUpperCase().includes("ZAJĘCIA");

                // Cleaning Description (Skracanie opisu)
                // Ucinamy WSZYSTKO od momentu wystąpienia tych słów
                const keywordsToCut = [
                    "proponowane wydarzenia", 
                    "popularne wśród znajomych", 
                    "goście", 
                    "poznaj organizatora",
                    "transparentność wydarzeń",
                    "informacje o wydarzeniu",
                    "szczegóły",
                    "pokaż wszystkich",
                    "pokaż mniej"
                ];

                // Use detailsText for description if available (cleaner), otherwise full text
                let cleanText = detailsText.length > 50 ? detailsText : text;
                const lowerText = cleanText.toLowerCase();
                
                // Znajdź indeks pierwszego wystąpienia któregokolwiek ze słów
                let cutIndex = cleanText.length;
                
                keywordsToCut.forEach(kw => {
                    const idx = lowerText.indexOf(kw.toLowerCase());
                    if (idx !== -1 && idx < cutIndex) {
                        cutIndex = idx;
                    }
                });
                
                cleanText = cleanText.substring(0, cutIndex).trim();

                if (!isExcluded) {
                     events.push({
                        url: window.location.href.split('?')[0],
                        rawDate: date,
                        title: title,
                        location: location || "Adres w opisie",
                        description: cleanText.trim()
                    });
                }
            }
        }
        
        // ZAKOŃCZ SKRYPT JEŚLI TO BYŁO POJEDYNCZE WYDARZENIE
        // Aby nie skanować paska bocznego ("Proponowane")
        if (events.length > 0) {
            console.log("✅ Pbrano pojedyncze wydarzenie. Pomijam listę poboczną.");
            finalize(events);
            return; 
        }
    }


    // ---------------------------------------------------------
    // TRYB: LISTA WYDARZEŃ (uzupełnienie)
    // ---------------------------------------------------------
    
    // ---------------------------------------------------------
    // HELPERY DO DATY
    // ---------------------------------------------------------
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
        
        // Regex: "20 PAŹ" lub "PT., 20 PAŹ"
        const regex = /(\d{1,2})\s+(STY|LUT|MAR|KWI|MAJ|CZE|LIP|SIE|WRZ|PAŹ|PAZ|LIS|GRU)/;
        const match = text.match(regex);
        if (match) {
             const day = parseInt(match[1]);
             const month = months[match[2]];
             const d = new Date(currentYear, month, day);
             
             // Korekta roku: jeśli data jest w przeszłości o więcej niż miesiąc, zakładamy przyszły rok
             // (np. skanujemy w Grudniu event na Styczeń)
             if (d < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) { 
                 d.setFullYear(currentYear + 1);
             }
             return d;
        }
        return null;
    }

    // Zakres dat: OD DZIŚ DO NIEDZIELI
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const nextSunday = new Date(today);
    // Jeśli dziś niedziela, to chcemy DO TEJ niedzieli (czyli dziś) czy przyszłej?
    // "Od teraz do niedzieli" sugeruje najbliższy "koniec tygodnia".
    const daysToSunday = (7 - today.getDay()) % 7; 
    // Jeśli dziś niedziela (0) -> daysToSunday = 0 -> end = today. 
    // Jeśli dziś środa (3) -> daysToSunday = 4 -> end = sunday.
    nextSunday.setDate(today.getDate() + daysToSunday);
    nextSunday.setHours(23, 59, 59, 999);

    console.log(`📅 Filtrowanie dat: od ${today.toLocaleDateString()} do ${nextSunday.toLocaleDateString()}`);


    // ---------------------------------------------------------
    // TRYB: LISTA WYDARZEŃ (uzupełnienie)
    // ---------------------------------------------------------
    
    // Pobieramy linki, ale sprawdzamy czy nie duplikujemy tego co już mamy (Main Event)
    const links = Array.from(document.querySelectorAll('a[href*="/events/"]'));

    const uniqueLinks = new Set();
    // Dodaj URL eventu głównego (jeśli istnieje), żeby go nie dublować
    if (events.length > 0) uniqueLinks.add(events[0].url);

    links.forEach(link => {
        const href = link.href.split('?')[0]; // Usuń parametry trackingu
        if(uniqueLinks.has(href)) return;
        
        // Pomijamy linki, które nie kończą się ID (np. /events/top)
        if(!href.match(/\/events\/\d+/)) return;

        uniqueLinks.add(href);

        // Znajdź najbliższy sensowny kontener (często to kilka poziomów wyżej)
        let container = link.closest('div[style*="border-radius"], div[class*="x1"], div[role="article"]');
        if(!container) container = link.parentElement.parentElement.parentElement;

        if (container) {
            // ZABEZPIECZENIE: Sprawdź czy kontener nie jest za duży
            const otherLinks = container.querySelectorAll('a[href*="/events/"]');
            if (otherLinks.length > 2) { 
                 container = link.closest('div.x1yztbdb') || link.parentElement.parentElement;
            }

            const textContent = container ? container.innerText : "";
            const lines = textContent.split('\n').filter(l => l.trim().length > 0);
            
            // LOGIKA CARD (Title vs Date first)
            let dateStr = "";
            let title = "";
            let location = "";

            const isDateLine = (txt) => {
                if(!txt) return false;
                return parseFBDate(txt) !== null;
            };

            // SCENARIUSZ 1: Date First
            if (isDateLine(lines[0])) {
                dateStr = lines[0];
                title = lines[1] || "";
                location = lines[2] || "";
            } 
            // SCENARIUSZ 2: Title First (Proponowane)
            else if (isDateLine(lines[1])) {
                title = lines[0];
                const parts = lines[1].split('·');
                dateStr = parts[0].trim();
                location = parts[1] ? parts[1].trim() : (lines[2] || "");
            }
            // Falback
            else {
                title = link.innerText || link.getAttribute('aria-label') || "";
                dateStr = lines.find(l => isDateLine(l)) || "";
            }

            // Clean title
            if(dateStr.toUpperCase().includes("INTERESUJE") || dateStr.toUpperCase().includes("WEZMĘ")) {
                 if (isDateLine(lines[1])) { dateStr = lines[1]; title = lines[2]; }
                 else if (isDateLine(lines[2])) { dateStr = lines[2]; title = lines[3]; }
            }
            if (!title) title = "Bez tytułu";

            // --- FILTROWANIE DATY ---
            const eventDate = parseFBDate(dateStr);
            if (eventDate) {
                // Reset godziny eventu dla porównania dni
                const eDateCheck = new Date(eventDate);
                eDateCheck.setHours(0,0,0,0);

                if (eDateCheck < today || eDateCheck > nextSunday) {
                    // console.log(`Skipping ${title} (${dateStr}) - out of range`);
                    return; 
                }
            } else {
                // Jeśli nie udało się sparsować daty, bezpieczniej pominąć (żeby nie zaciągać śmieci)
                // Chyba że użytkownik chce ryzykować.
                // W "Proponowanych" często są daty, więc lepiej pominąć te bez daty.
                return;
            }

            // FILTER: Pomiń warsztaty, kursy i zajęcia
            if (title.toUpperCase().includes("WARSZTATY") || title.toUpperCase().includes("KURS") || title.toUpperCase().includes("ZAJĘCIA")) {
                return;
            }

            console.log(`➕ Dodano: ${title} [${dateStr}]`);

            events.push({
                url: href,
                rawDate: dateStr,
                title: title,
                location: location,
                description: textContent || ""
            });
        }
    });


    finalize(events);

    function finalize(eventsList) {
        if (eventsList.length > 0) {
            const json = JSON.stringify(eventsList, null, 2);
            copyToClipboard(json);
            console.log(`✅ Znaleziono ${eventsList.length} wydarzeń!`);
            console.table(eventsList);
            alert(`✅ Sukces! Skopiowano ${eventsList.length} wydarzeń do schowka.\nTeraz wklej to w Generatorze.`);
        } else {
            console.warn("⚠️ Nie znaleziono wydarzeń. Sprawdź czy jesteś na poprawnej stronie lub czy FB nie zmienił kodu.");
            alert("⚠️ Nie znaleziono wydarzeń. Spróbuj przewinąć stronę niżej i uruchom skrypt ponownie.");
        }
    }

    function copyToClipboard(text) {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }

})();
