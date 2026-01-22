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
        Kraków: ['Sabrosa', 'Tropical spot', 'Tauron Arena'],
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
            const toggle = document.createElement('label')
            toggle.appendChild(checkbox)
            toggle.append(` Wydarzenie taneczne ${i + 1}`)

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

            const promoteInput = document.createElement('input')
            promoteInput.type = 'checkbox'
            promoteInput.className = 'promowane'
            const promoteLabel = document.createElement('label')
            promoteLabel.appendChild(promoteInput)
            promoteLabel.append(' ⭐ Promuj')

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
            })

            updateMiejscaOptions(selectMiasto.value)

            eventBlock.append(
                selectMiasto,
                inputMiastoInne,
                selectMiejsce,
                inputMiejsceInne,
                opisInput,
                styleBox,
                inputLink,
                promoteLabel
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
                block.style.display = show ? 'block' : 'none'
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
    applyFilter()
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
            const promote = eventBlock.querySelector('.promowane').checked

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