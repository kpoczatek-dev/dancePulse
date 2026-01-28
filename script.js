document.addEventListener('DOMContentLoaded', function () {
	const LICZBA_DNI = 14 // 2 tygodnie od jutra

	const miejscaWgMiasta = {
		Katowice: [
			'Marcepan',
			'Gravitacja',
			'NOSPR',
			'GoodMood',
			'LaClave',
			'MilPasos',
			'Taneczna Kompania',
			'Nowy Dekameron',
			'Tapas LaFirinda',
			'Królestwo',
			'Dolina trzech stawów',
		],
		Chorzów: ['Taneczne Kręgi', 'Pizzeria Róża'],
		Tychy: ['Przystań Kajakowa', 'Mohito', 'Dzika plaża'],
		Kraków: ['Sabrosa', 'Tropical spot', 'Tauron Arena', 'Forum Tańca'],
		'Bielsko-Biala': ['Festiwal Kubański', 'DANCE#LOVEit', 'Metrum', 'Grzyńskiego', 'Hotel Sahara'],
		Gliwice: ['Mohito', 'LaClave', 'Rynek'],
		Bytom: ['Majowa'],
		Świętochłowice: ['Stylowa Willa'],
		'Tarnowskie Góry': ['Ocean Club'],
		Rybnik: ['Pink Bowling & Club'],
		'Dąbrowa Górnicza': ['Beach Bar Pogoria'],
	}

	const style = [
		'Salsa',
		'Bachata',
		'Kizomba',
		'Zouk',
		'Linia',
		'Cubana',
		'Rumba',
		'Afro',
		'Koncert',
		'Latino',
		'Reggeton',
	]
	const dniTygodnia = ['NIEDZIELA', 'PONIEDZIAŁEK', 'WTOREK', 'ŚRODA', 'CZWARTEK', 'PIĄTEK', 'SOBOTA']

	function formatujDatePL(date) {
		const d = date.getDate().toString().padStart(2, '0')
		const m = (date.getMonth() + 1).toString().padStart(2, '0')
		return `${d}.${m}`
	}

	function dodajDni(date, ile) {
		const d = new Date(date)
		d.setDate(d.getDate() + ile)
		return d
	}

	function generujDniOdJutra(ileDni) {
		const dzis = new Date()
		const start = dodajDni(dzis, 1)
		const result = []
		for (let i = 0; i < ileDni; i++) {
			const d = dodajDni(start, i)
			const dzienTyg = dniTygodnia[d.getDay()]
			result.push({
				date: d,
				label: `${dzienTyg} (${formatujDatePL(d)})`,
				dzienTygIndex: d.getDay(),
			})
		}
		return result
	}

	const dni = generujDniOdJutra(LICZBA_DNI)
	const form = document.getElementById('form')

	// Generowanie pól formularza
	dni.forEach(dzienObj => {
		const block = document.createElement('div')
		block.className = 'day-block'
		block.dataset.date = dzienObj.date.toISOString()
		block.dataset.dzienTygIndex = dzienObj.dzienTygIndex
		block.innerHTML = `<h3>${dzienObj.label}</h3>`

		for (let i = 0; i < 5; i++) {
			const container = document.createElement('div')
			const checkbox = document.createElement('input')
			checkbox.type = 'checkbox'
            checkbox.className = 'toggle-checkbox' // Add class for selection

            // Promote button (moved to header)
			const promoteInput = document.createElement('input')
			promoteInput.type = 'checkbox'
			promoteInput.className = 'promowane'
			const promoteLabel = document.createElement('label')
            promoteLabel.style.cursor = 'pointer';
            promoteLabel.style.marginLeft = '10px';
            promoteLabel.style.marginRight = '5px';
            promoteLabel.style.display = 'none'; // Hidden by default
			promoteLabel.appendChild(promoteInput)
			promoteLabel.append(' ⭐') // Minimalist icon
            
            // Prevent expanding/collapsing when clicking promote
            promoteLabel.addEventListener('click', function(e) { e.stopPropagation(); });


			const toggle = document.createElement('label')
            toggle.style.display = 'flex';
            toggle.style.alignItems = 'center';
            toggle.style.cursor = 'pointer';

			toggle.appendChild(checkbox)
			toggle.append(` Wydarzenie taneczne ${i + 1} `) // Added space
            toggle.appendChild(promoteLabel) // Insert AFTER text

			const eventBlock = document.createElement('div')
			eventBlock.className = 'event-block'
			eventBlock.style.display = 'none'

			const selectMiasto = document.createElement('select')
			selectMiasto.className = 'miasto'
			selectMiasto.innerHTML =
				Object.keys(miejscaWgMiasta)
					.map(m => `<option value="${m}">${m}</option>`)
					.join('') + '<option value="Inne">Inne</option>'

			const inputMiastoInne = document.createElement('input')
			inputMiastoInne.className = 'miasto-inne'
			inputMiastoInne.placeholder = 'Wpisz miasto'
			inputMiastoInne.style.display = 'none'

			const selectMiejsce = document.createElement('select')
			selectMiejsce.className = 'miejsce'

			const inputMiejsceInne = document.createElement('input')
			inputMiejsceInne.className = 'miejsce-inne'
			inputMiejsceInne.placeholder = 'Wpisz miejsce'
			inputMiejsceInne.style.display = 'none'

			const inputLink = document.createElement('input')
			inputLink.type = 'text'
			inputLink.className = 'link'
			inputLink.placeholder = 'Link'

			const opisInput = document.createElement('input')
			opisInput.type = 'text'
			opisInput.className = 'opis'
			opisInput.placeholder = 'Krótki opis'
            
			const styleBox = document.createElement('div')
			styleBox.className = 'checkboxes'
			styleBox.innerHTML = style
				.map(s => `<label><input type="checkbox" class="styl" value="${s}"> ${s}</label>`)
				.join('')

			function updateMiejscaOptions(miasto) {
				if (miasto === 'Inne') {
					selectMiejsce.style.display = 'none'
					inputMiejsceInne.style.display = 'block'
					inputMiastoInne.style.display = 'block'
				} else {
					selectMiejsce.style.display = 'block'
					inputMiejsceInne.style.display = 'none'
					inputMiastoInne.style.display = 'none'
					selectMiejsce.innerHTML =
						(miejscaWgMiasta[miasto] || []).map(m => `<option value="${m}">${m}</option>`).join('') +
						'<option value="Inne">Inne</option>'
				}
			}

			selectMiasto.addEventListener('change', function () {
				updateMiejscaOptions(this.value)
			})
			selectMiejsce.addEventListener('change', function () {
				inputMiejsceInne.style.display = this.value === 'Inne' ? 'block' : 'none'
			})
			checkbox.addEventListener('change', function () {
				eventBlock.style.display = this.checked ? 'block' : 'none'
                promoteLabel.style.display = this.checked ? 'inline-block' : 'none'
			})

			updateMiejscaOptions(selectMiasto.value)

			eventBlock.append(
				selectMiasto,
				inputMiastoInne,
				selectMiejsce,
				inputMiejsceInne,
				opisInput,
				styleBox,
				inputLink
			)
			container.append(toggle, eventBlock)
			block.appendChild(container)
		}
		form.appendChild(block)
	})

	// Filtrowanie
	const filterSelect = document.getElementById('filter-select')
	filterSelect.addEventListener('change', applyFilter)

	function applyFilter() {
		const value = filterSelect.value
		const blocks = document.querySelectorAll('.day-block')

		if (value === 'all') {
			blocks.forEach(block => {
				block.style.display = 'block'
			})
			return
		}

		if (value === 'thisweek') {
			const today = new Date()
			const currentDayOfWeek = today.getDay()

			blocks.forEach((block, index) => {
				const blockDay = parseInt(block.dataset.dzienTygIndex)
				const blockDate = new Date(block.dataset.date)

				// Oblicz, ile dni pozostało do najbliższego czwartku
				let daysUntilThursday
				if (currentDayOfWeek <= 4) {
					daysUntilThursday = 4 - currentDayOfWeek
				} else {
					daysUntilThursday = 4 + (7 - currentDayOfWeek)
				}

				const nextThursday = new Date(today)
				nextThursday.setDate(today.getDate() + daysUntilThursday + 1)
				nextThursday.setHours(0, 0, 0, 0)

				const nextSunday = new Date(nextThursday)
				nextSunday.setDate(nextThursday.getDate() + 3)

				const blockDateNormalized = new Date(blockDate)
				blockDateNormalized.setHours(0, 0, 0, 0)

				const show = blockDateNormalized >= nextThursday && blockDateNormalized <= nextSunday
				
				// Ukryj poniedziałek (dzienTygIndex == 1)
				const isMonday = block.dataset.dzienTygIndex == '1';
				
				block.style.display = (show && !isMonday) ? 'block' : 'none'
			})
			return
		}

		if (value === 'weekend') {
			let firstFridayIndex = null
			let fridayCount = 0

			dni.forEach((d, i) => {
				if (d.dzienTygIndex === 5) {
					fridayCount++
					if (fridayCount === 1) firstFridayIndex = i
				}
			})

			blocks.forEach((block, index) => {
				let show = false
				if (firstFridayIndex !== null) {
					show = [firstFridayIndex, firstFridayIndex + 1, firstFridayIndex + 2].includes(index)
				}
				block.style.display = show ? 'block' : 'none'
			})
		}
	}

	document.getElementById('generuj-btn').addEventListener('click', generujPost)
	document.getElementById('import-btn').addEventListener('click', importujZFacebooka)
	applyFilter()

    function importujZFacebooka() {
        const jsonText = document.getElementById('import-fb-data').value;
        if (!jsonText.trim()) {
            alert('Wklej najpierw JSON!');
            return;
        }

        try {
            const events = JSON.parse(jsonText);
            let importedCount = 0;

            events.forEach(ev => {
                // Próba parsowania daty
                // Format FB bywa różny: "SOB., 2 LUT O 21:00", "DZISIAJ O 20:00", "JUTRO O 21:00"
                // To jest trudne, więc zrobimy uproszczony parser szukający dnia i miesiąca
                
                let parsedDate = parsujDateFB(ev.rawDate);
                // Jeśli nie udało się z rawDate (np. "Popularne wśród znajomych"), spróbuj z tytułu
                if (!parsedDate) {
                    parsedDate = parsujDateFB(ev.title);
                }
                
                if (!parsedDate) return;

                // FILTER: Importuj tylko od DZIŚ do najbliższej niedzieli włącznie
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Resetujemy czas dzisiejszy na początek dnia

                // Oblicz najbliższą niedzielę (tą nadchodzącą lub dzisiejszą)
                let nextSunday = new Date(today);
                if (today.getDay() === 0) {
                     nextSunday = new Date(today); // Dziś niedziela
                } else {
                     nextSunday.setDate(today.getDate() + (7 - today.getDay()));
                }
                nextSunday.setHours(23, 59, 59, 999);

                // Jeśli data wydarzenia jest starsza niż dziś LUB później niż ta niedziela, pomiń
                if (parsedDate < today || parsedDate > nextSunday) return;

                // Znajdź odpowiedni blok dnia
                const dayBlock = Array.from(document.querySelectorAll('.day-block')).find(block => {
                    const d = new Date(block.dataset.date);
                    return d.getDate() === parsedDate.getDate() && d.getMonth() === parsedDate.getMonth();
                });

                if (dayBlock) {
                    // Znajdź pierwszy wolny slot (ukryty event-block)
                    const freeSlot = Array.from(dayBlock.querySelectorAll('.event-block')).find(el => el.style.display === 'none');
                    
                    if (freeSlot) {
                        // Checkbox aktywujący
                        const checkbox = freeSlot.previousElementSibling.querySelector('.toggle-checkbox');
                        checkbox.checked = true;
                        freeSlot.style.display = 'block';

                        // Pokaż przycisk promuj (jeśli był ukryty)
                        const promoteLabel = freeSlot.previousElementSibling.querySelector('label'); 
                        // Uwaga: nasza struktura to label > checkbox, promoteLabel
                        // freeSlot.previousElementSibling to ten główny label (toggle)
                        // Szukamy w nim labela od promuj.
                        // Ale promoteLabel nie ma klasy. Dodaliśmy mu styl display manually.
                        // Znajdźmy go po klasie inputu w środku
                        const promoteInput = freeSlot.previousElementSibling.querySelector('.promowane');
                        if (promoteInput && promoteInput.parentElement) {
                            promoteInput.parentElement.style.display = 'inline-block';
                        }
                        
                        const miastoInput = freeSlot.querySelector('.miasto-inne');
                        const miastoSelect = freeSlot.querySelector('.miasto');
                        const miejsceInput = freeSlot.querySelector('.miejsce-inne');
                        const miejsceSelect = freeSlot.querySelector('.miejsce');
                        const opisInput = freeSlot.querySelector('.opis');
                        const linkInput = freeSlot.querySelector('.link');

                        // --- 1. Wykrywanie MIEJSCA po adresie ---
                        // Mapa: fragment adresu (lowercase) -> nazwa miejsca (dokładnie jak w select)
                        const adresyMap = {
                            'chorzowska 11': 'LaClave',
                            'kamienna 4': 'MilPasos',
                            'zwycięstwa 52': 'Mohito',
                            'zwycięstwa 52a': 'Mohito',
                            'good mood': 'GoodMood',
                            'paderewskiego': 'GoodMood', // Good Mood Katowice
                            'mariacka': 'Klub Pomarańcza', // Przykładowe, można dodać więcej
                            'plac grunwaldzki': 'NOSPR',
                            'rynek': 'Rynek',
                            'dworcowa 8': 'Stylowa Willa',
                            'rondo mogilskie 1': 'Sabrosa',
                            'dworkowa 2': 'Cavatina Hall',
                            'gravitacja': 'Gravitacja',
                        };

                        let znalezioneMiasto = 'Inne';
                        let dopasowaneMiejsce = null;

                        const locationLower = (ev.location || '').toLowerCase();
                        const titleLower = (ev.title || '').toLowerCase();

                        // Najpierw szukamy po adresie
                        for (const [adres, miejsce] of Object.entries(adresyMap)) {
                            if (locationLower.includes(adres)) {
                                dopasowaneMiejsce = miejsce;
                                // Znajdź miasto dla tego miejsca
                                for (const [miasto, miejsca] of Object.entries(miejscaWgMiasta)) {
                                    if (miejsca.includes(miejsce)) {
                                        znalezioneMiasto = miasto;
                                        break;
                                    }
                                }
                                break;
                            }
                        }

                        // Jeśli nie ma po adresie, szukamy po nazwie miasta w lokalizacji
                        if (!dopasowaneMiejsce) {
                            for (const m in miejscaWgMiasta) {
                                if (locationLower.includes(m.toLowerCase())) {
                                    znalezioneMiasto = m;
                                    break;
                                }
                            }
                        }

                        // Ustawianie selectów
                        miastoSelect.value = znalezioneMiasto;
                        const eventChange = new Event('change');
                        miastoSelect.dispatchEvent(eventChange);

                        if (dopasowaneMiejsce) {
                            miejsceSelect.value = dopasowaneMiejsce;
                            miejsceSelect.dispatchEvent(new Event('change'));
                        } else if (znalezioneMiasto === 'Inne') {
                            miastoInput.value = ev.location || '';
                        } else {
                            // Znaleziono miasto, ale miejsce nieznane -> Inne
                             miejsceInput.value = ev.location || '';
                             miejsceSelect.value = 'Inne';
                             miejsceSelect.dispatchEvent(new Event('change'));
                        }

                        // --- 2. Wykrywanie STYLU po słowach kluczowych ---
                        // Mapa: słowo kluczowe -> value checkboxa
                        const styleKeywords = {
                            'salsa': 'Salsa',
                            'cuban': 'Salsa', // Cubana?
                            'casino': 'Salsa',
                            'rueda': 'Salsa',
                            'mambo': 'Salsa',
                            'bachata': 'Bachata',
                            'bachat': 'Bachata',
                            'dominicana': 'Bachata',
                            'kizomba': 'Kizomba',
                            'kiz': 'Kizomba',
                            'semba': 'Kizomba',
                            'tarraxo': 'Kizomba',
                            'urban': 'Kizomba',
                            'zouk': 'Zouk',
                            'lambada': 'Zouk',
                            'west': 'Linia',
                            'wcs': 'Linia',
                            'cubana': 'Cubana',
                            'rumba': 'Rumba',
                            'afro': 'Afro',
                            'koncert': 'Koncert',
                            'latino': 'Latino',
                            'sabor': 'Latino',
                            'reggaeton': 'Reggeton',
                            'reggeton': 'Reggeton'
                        };

                        const checkboxes = freeSlot.querySelectorAll('input.styl');
                        // Reset checkboxów
                        checkboxes.forEach(cb => cb.checked = false);

                        // Dołączamy opis do przeszukiwania (jeśli jest)
                        const textToSearch = (titleLower + ' ' + locationLower + ' ' + (ev.description || '')).toLowerCase();
                        
                        Object.entries(styleKeywords).forEach(([key, val]) => {
                            if (textToSearch.includes(key)) {
                                const cb = Array.from(checkboxes).find(c => c.value === val);
                                if (cb) cb.checked = true;
                            }
                        });


                        opisInput.value = ev.title.split('\n')[1] || ev.title; // Próba wzięcia drugiej linii (często tytuł właściwy), bo pierwsza to data
                        if (opisInput.value.length > 100) opisInput.value = opisInput.value.substring(0, 100) + '...'; // Skróć za długie
                        
                        linkInput.value = ev.url;
                        
                        importedCount++;
                    }
                }
            });

            document.getElementById('import-fb-data').value = ''; // Wyczyść pole po udanym imporcie
            alert(`Zaimportowano ${importedCount} wydarzeń!`);

        } catch (e) {
            console.error(e);
            alert('Błąd parsowania JSON. Sprawdź czy skopiowałeś poprawnie.');
        }
    }

    function parsujDateFB(text) {
        if (!text) return null;
        text = text.toUpperCase();
        
        const now = new Date();
        const currentYear = now.getFullYear();

        if (text.includes('DZISIAJ')) return now;
        if (text.includes('JUTRO')) return dodajDni(now, 1);
        if (text.includes('POJUTRZE')) return dodajDni(now, 2);

        // 1. Oczyszczanie ze śmieci typu "Popularne", "W trakcie"
        // Jeśli linia nie zawiera cyfry ani nazwy dnia, pewnie jest śmieciem. Szukamy w tytule? 
        // W scrapperze przekazujemy rawDate jako linię 0. Czasem data jest w tytце.
        // Tutaj spróbujmy wyłapać dni tygodnia.

        const dniTyg = ['NIEDZIELA', 'PONIEDZIAŁEK', 'WTOREK', 'ŚRODA', 'CZWARTEK', 'PIĄTEK', 'SOBOTA'];
        const dniSkroty = ['NIE', 'PON', 'WTO', 'ŚRO', 'CZW', 'PIĄ', 'PT', 'SOB']; 
        
        // Mapowanie skrótów na index dnia (0-6)
        const dniMap = {
            'NIEDZIELA': 0, 'NIE': 0, 'ND': 0,
            'PONIEDZIAŁEK': 1, 'PON': 1, 'PN': 1,
            'WTOREK': 2, 'WTO': 2, 'WT': 2,
            'ŚRODA': 3, 'ŚRO': 3, 'SR': 3,
            'CZWARTEK': 4, 'CZW': 4,
            'PIĄTEK': 5, 'PIĄ': 5, 'PT': 5,
            'SOBOTA': 6, 'SOB': 6, 'SB': 6
        };

        // Obsługa "SOBOTA W TYM TYGODNIU" lub "SOB O ..." lub "SOB., 21:00"
        // Jeśli nie wykryto konkretnej daty (liczb), a jest dzień tygodnia i coś po nim
        const hasSpecificDate = /(\d{1,2})\s+(STY|LUT|MAR|KWI|MAJ|CZE|LIP|SIE|WRZ|PAŹ|LIS|GRU)/.test(text) || /(\d{1,2})\.(\d{1,2})/.test(text);

        if (!hasSpecificDate) {
            for (const [key, val] of Object.entries(dniMap)) {
                if (text.includes(key)) {
                    // Znajdź datę tego dnia w najbliższej przyszłości (lub dziś)
                    const todayDay = now.getDay();
                    const targetDay = val;
                    let diff = targetDay - todayDay;
                    if (diff < 0) diff += 7; // Jeśli minął, to bierzemy następy (np. dziś Środa, szukamy Wtorku -> za 6 dni)
                    
                    // Jeśli text zawiera "W TYM TYGODNIU", a diff sugerowałby przeszłość (gdybyśmy nie dodali 7), to logicznie FB usunęłoby event.
                    // Ale dla "SOB., 21:00" zakładamy najbliższą sobotę.
                    return dodajDni(now, diff);
                }
            }
        }

        // Szukamy np. "2 LUT"
        const months = {
            'STY': 0, 'LUT': 1, 'MAR': 2, 'KWI': 3, 'MAJ': 4, 'CZE': 5,
            'LIP': 6, 'SIE': 7, 'WRZ': 8, 'PAŹ': 9, 'LIS': 10, 'GRU': 11
        };

        const regex = /(\d{1,2})\s+(STY|LUT|MAR|KWI|MAJ|CZE|LIP|SIE|WRZ|PAŹ|LIS|GRU)/;
        const match = text.match(regex);

        if (match) {
            const day = parseInt(match[1]);
            const monthCode = match[2];
            const month = months[monthCode];
            
            const d = new Date(currentYear, month, day);
            // Wykrywanie roku
            if (d < new Date(now.getTime() - 86400000 * 60)) { // Jeśli data jest > 2 miesiace temu, to pewnie przyszły rok
                 d.setFullYear(currentYear + 1);
            }
            return d;
        }

        // Obsługa formatu DD.MM (np. 31.01)
        const regexDot = /(\d{1,2})\.(\d{1,2})/;
        const matchDot = text.match(regexDot);
        if (matchDot) {
             const day = parseInt(matchDot[1]);
             const month = parseInt(matchDot[2]) - 1; // JS miesiące są 0-11
             const d = new Date(currentYear, month, day);
             
             // Rok check
             if (d < new Date(now.getTime() - 86400000 * 60)) { 
                 d.setFullYear(currentYear + 1);
            }
            return d;
        }

        return null;
    }
})

function generujPost() {
	const blocks = document.querySelectorAll('.day-block')
	let wynik = '🎉 Zestawienie imprezowe:\n\n'
	let wynikAnkieta = ''

	blocks.forEach(block => {
		if (block.style.display === 'none') return

		const containers = block.querySelectorAll('.event-block')
		const dzienTekst = block.querySelector('h3').textContent
		let dzienWiersz = ''

		containers.forEach(eventBlock => {
			const checkbox = eventBlock.previousElementSibling.querySelector('input[type=checkbox]')
			if (!checkbox || !checkbox.checked) return

			const miasto = eventBlock.querySelector('.miasto')
			const miastoInne = eventBlock.querySelector('.miasto-inne')
			const miejsce = eventBlock.querySelector('.miejsce')
			const miejsceInne = eventBlock.querySelector('.miejsce-inne')
			const opis = eventBlock.querySelector('.opis')
			const link = eventBlock.querySelector('.link')
			const styleCbs = eventBlock.querySelectorAll('input.styl:checked')
			// Promote checkbox teraz jest w headerze (toggle-checkbox sibling)
			const promote = eventBlock.previousElementSibling.querySelector('.promowane').checked

			const finalMiasto = miasto.value === 'Inne' ? miastoInne.value.trim() : miasto.value
			const finalMiejsce = miejsce.value === 'Inne' ? miejsceInne.value.trim() : miejsce.value
			const styleTekst = [...styleCbs].map(cb => cb.value).join('/')

			const prefix = promote ? '⭐ ' : '➡️ '
			dzienWiersz += `${prefix}${finalMiasto}: ${finalMiejsce} (${styleTekst})${
				opis.value.trim() ? ` – ${opis.value.trim()}` : ''
			}\n`
			if (link.value.trim()) dzienWiersz += `${link.value.trim()}\n`

			wynikAnkieta += `${dzienTekst}: ${finalMiasto} - ${finalMiejsce} (${styleTekst})\n`
		})

		if (dzienWiersz) wynik += `🗓️ ${dzienTekst}:\n${dzienWiersz}\n`
	})

	wynik += 'Do zobaczenia! 💃🕺\n\n' + document.getElementById('hashtagi').value
	document.getElementById('wynik').value = wynik
	document.getElementById('ankieta').value = wynikAnkieta

	const ankietaDiv = document.getElementById('kopiuj-ankiete') || document.createElement('div')
	ankietaDiv.id = 'kopiuj-ankiete'
	document.body.appendChild(ankietaDiv)
	ankietaDiv.innerHTML = '<h4>Kliknij, aby skopiować linię ankiety:</h4>'

	wynikAnkieta
		.trim()
		.split('\n')
		.filter(l => l)
		.forEach(l => {
			const div = document.createElement('div')
			div.className = 'copy-line'
			div.style.marginBottom = '5px'
			const btn = document.createElement('button')
			btn.textContent = '📋 ' + l
			btn.onclick = () => {
				navigator.clipboard.writeText(l)
				btn.textContent = '✅ Skopiowano!'
				setTimeout(() => (btn.textContent = '📋 ' + l), 1000)
			}
			div.appendChild(btn)
			ankietaDiv.appendChild(div)
		})
}

function kopiujWynik() {
	const text = document.getElementById('wynik').value
	navigator.clipboard.writeText(text)
	alert('Skopiowano cały post!')
}
