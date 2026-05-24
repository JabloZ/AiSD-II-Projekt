import { initMapEditor, getMapData } from './js/mapEditor.js';

// ═══════════════════════════════════════════════════════════════
// ALGORYTMY
// ═══════════════════════════════════════════════════════════════

const ALGORITHMS = [
    {
        id: 'hungarian',
        name: 'Algorytm Węgierski',
        shortName: 'Węgierski',
        complexity: 'O(n³)',
        spaceComplexity: 'O(n²)',
        description: 'Algorytm optymalnego przydziału zasobów w grafach dwudzielnych. Gwarantuje minimalizację łącznego kosztu przydziału krasnoludków do kopalni.',
        steps: [
            'Zbuduj macierz kosztów (dystans każdego krasnoludka do każdej kopalni)',
            'Odejmij minimum każdego wiersza od wszystkich elementów w tym wierszu',
            'Odejmij minimum każdej kolumny od wszystkich elementów w tej kolumnie',
            'Wyznacz minimalne pokrycie zerami w macierzy',
            'Jeśli liczba linii = n → odczytaj optymalny przydział i zakończ',
            'W przeciwnym razie: zmodyfikuj macierz i wróć do kroku 4',
        ],
    },
    {
        id: 'greedy',
        name: 'Algorytm Zachłanny',
        shortName: 'Zachłanny',
        complexity: 'O(n² log n)',
        spaceComplexity: 'O(n)',
        description: 'Heurystyczny algorytm zachłanny. Szybki, ale nie gwarantuje optymalnego rozwiązania — w każdym kroku wybiera lokalnie najtańszy wolny przydział.',
        steps: [
            'Wylicz koszt (dystans) dla każdej możliwej pary (krasnoludek, kopalnia)',
            'Posortuj wszystkie pary rosnąco według kosztu',
            'Dla każdej pary: jeśli krasnoludek i kopalnia są wolni — przydziel',
            'Powtarzaj aż wszyscy krasnoludkowie są przydzieleni lub lista wyczerpana',
        ],
    },
    {
        id: 'random',
        name: 'Algorytm Losowy',
        shortName: 'Losowy',
        complexity: 'O(n)',
        spaceComplexity: 'O(n)',
        description: 'Losowy przydział krasnoludków do dostępnych kopalni. Służy jako punkt odniesienia do porównania z innymi algorytmami.',
        steps: [
            'Przetasuj listę kopalni w losowej kolejności (Fisher-Yates)',
            'Przydziel każdemu krasnoludkowi kolejną kopalnię z przetasowanej listy',
        ],
    },
];

// ═══════════════════════════════════════════════════════════════
// ZESTAWY DANYCH (localStorage)
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY = 'kk_datasets_v3';

function datasetsLoad() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
}

function datasetsSave(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function datasetsGetAll() {
    return datasetsLoad();
}

function datasetsGetById(id) {
    const all = datasetsLoad();
    for (const d of all) {
        if (d.id === id) return d;
    }
    return null;
}

function datasetsCreate(data) {
    const list = datasetsLoad();
    const dataset = {
        id:        crypto.randomUUID(),
        name:      data.name   || 'Nowy zestaw',
        border:    data.border || [],
        houses:    data.houses || [],
        mines:     data.mines  || [],
        createdAt: Date.now(),
    };
    list.push(dataset);
    datasetsSave(list);
    return dataset;
}

function datasetsUpdate(id, data) {
    const list = datasetsLoad();
    for (let i = 0; i < list.length; i++) {
        if (list[i].id === id) {
            list[i] = { ...list[i], ...data, id };
            datasetsSave(list);
            return list[i];
        }
    }
    return null;
}

function datasetsRemove(id) {
    datasetsSave(datasetsLoad().filter(d => d.id !== id));
}

function datasetStats(ds) {
    let totalDwarfs = 0;
    for (const h of (ds.houses || [])) {
        totalDwarfs += h.dwarfCount || 1;
    }
    return `${totalDwarfs} krasnoludków · ${(ds.mines || []).length} kopalni`;
}

function seedDefaults() {
    if (datasetsLoad().length > 0) return;

    datasetsCreate({
        name: 'Przykładowy (mały)',
        houses: [
            { id: '1', name: 'Domek Karminy', dwarfCount: 1, mineralPreferences: ['Złoto'],          dwarfNames: ['Karmina'] },
            { id: '2', name: 'Domek Bolka',   dwarfCount: 1, mineralPreferences: ['Węgiel'],         dwarfNames: ['Bolek'] },
            { id: '3', name: 'Domek Tolka',   dwarfCount: 1, mineralPreferences: ['Złoto', 'Miedź'], dwarfNames: ['Tolek'] },
            { id: '4', name: 'Domek Zbyszka', dwarfCount: 1, mineralPreferences: ['Węgiel'],         dwarfNames: ['Zbyszek'] },
        ],
        mines: [
            { id: '1', name: 'Kopalnia Złota',  mineral: 'Złoto',  capacity: 2 },
            { id: '2', name: 'Kopalnia Węgla',  mineral: 'Węgiel', capacity: 2 },
            { id: '3', name: 'Kopalnia Miedzi', mineral: 'Miedź',  capacity: 1 },
        ],
    });

    datasetsCreate({
        name: 'Przykładowy (średni)',
        houses: [
            { id: '1', name: 'Domek 1', dwarfCount: 2, mineralPreferences: ['Złoto', 'Srebro'], dwarfNames: ['Aleksy', 'Brygida'] },
            { id: '2', name: 'Domek 2', dwarfCount: 2, mineralPreferences: ['Węgiel'],          dwarfNames: ['Celestyn', 'Dorota'] },
            { id: '3', name: 'Domek 3', dwarfCount: 2, mineralPreferences: ['Miedź', 'Złoto'],  dwarfNames: ['Eryk', 'Felicja'] },
            { id: '4', name: 'Domek 4', dwarfCount: 2, mineralPreferences: ['Srebro'],          dwarfNames: ['Grzegorz', 'Halina'] },
        ],
        mines: [
            { id: '1', name: 'Kopalnia Północna',   mineral: 'Złoto',  capacity: 2 },
            { id: '2', name: 'Kopalnia Południowa', mineral: 'Węgiel', capacity: 3 },
            { id: '3', name: 'Kopalnia Wschodnia',  mineral: 'Miedź',  capacity: 2 },
            { id: '4', name: 'Kopalnia Zachodnia',  mineral: 'Srebro', capacity: 2 },
        ],
    });
}

// ═══════════════════════════════════════════════════════════════
// RUNNER (wywołanie backendu)
// ═══════════════════════════════════════════════════════════════

const API_URL = 'http://localhost:8001';
let lastLogs        = [];
let lastAssignments = [];
let lastTotalDist   = 0;

async function runAlgorithm(algoId, datasetId, onLog, onDone) {
    lastLogs        = [];
    lastAssignments = [];
    lastTotalDist   = 0;

    const dataset = datasetsGetById(datasetId);
    if (!dataset) {
        onLog('BŁĄD: Nie znaleziono zestawu danych.');
        onDone([], []);
        return;
    }

    const algo = ALGORITHMS.find(a => a.id === algoId);
    onLog(`[lokalne] Wysyłam żądanie: ${algo.name} | zestaw: "${dataset.name}"`);

    // Mapowanie id algorytmu na nazwę rozumianą przez backend
    const algoMap = { hungarian: 'mcmf', greedy: 'greedy', random: 'random' };

    const requestBody = {
        Algorithm: algoMap[algoId] || 'mcmf',
        Houses: dataset.houses.map(h => {
            const dwarfs = h.dwarfs || [];
            return {
                Id:                 h.id,
                X:                  h.x || 0,
                Y:                  h.y || 0,
                DwarfCount:         dwarfs.length || h.dwarfCount || 1,
                MineralPreferences: h.mineralPreferences || [],
                DwarfNames:         dwarfs.length ? dwarfs.map(d => d.name) : (h.dwarfNames || []),
                DwarfPreferences:   dwarfs.length ? dwarfs.map(d => d.mineralPreferences || []) : null,
            };
        }),
        Mines: dataset.mines.map(m => ({
            Id:          m.id,
            X:           m.x || 0,
            Y:           m.y || 0,
            MineralType: m.mineral,
            Capacity:    m.capacity || 1,
        })),
    };

    try {
        const response = await fetch(`${API_URL}/api/assign`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const text = await response.text();
            onLog(`BŁĄD HTTP ${response.status}: ${text}`);
            onDone(lastLogs, []);
            return;
        }

        const data = await response.json();

        lastAssignments = data.assignments  || [];
        lastTotalDist   = data.totalDistance || 0;

        for (const line of (data.logs || [])) {
            lastLogs.push(line);
            onLog(line);
        }

        onDone(lastLogs, lastAssignments);

    } catch (err) {
        const msg = `BŁĄD połączenia z backendem: ${err.message}`;
        onLog(msg);
        lastLogs.push(msg);
        onDone(lastLogs, []);
    }
}

function downloadLogs(filename) {
    const blob = new Blob([lastLogs.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = filename || 'wyniki.txt';
    a.click();
    URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════
// WIDOKI
// ═══════════════════════════════════════════════════════════════

let selectedAlgoId    = null;
let selectedDatasetId = null;
let editingDatasetId  = null;

function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// ── Modale ─────────────────────────────────────────────────────

document.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', () => {
        document.getElementById(el.dataset.closeModal).classList.add('hidden');
    });
});
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.classList.add('hidden');
    });
});

// ── Lista algorytmów ────────────────────────────────────────────

function renderAlgoList() {
    const container = document.getElementById('algo-list');
    container.innerHTML = '';
    for (const algo of ALGORITHMS) {
        const card = document.createElement('button');
        card.className = 'algo-card' + (selectedAlgoId === algo.id ? ' selected' : '');
        card.innerHTML = `
            <div class="algo-card-header">
                <span class="algo-name">${algo.name}</span>
                <span class="algo-complexity">${algo.complexity}</span>
            </div>
            <p class="algo-desc">${algo.description}</p>
        `;
        card.addEventListener('click', () => {
            selectedAlgoId = algo.id;
            renderAlgoList();
            updateFooter();
        });
        container.appendChild(card);
    }
}

// ── Lista zestawów danych ───────────────────────────────────────

function renderDatasetList() {
    const datasets  = datasetsGetAll();
    const container = document.getElementById('dataset-list');
    const empty     = document.getElementById('no-datasets');
    container.innerHTML = '';

    if (datasets.length === 0) {
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');

    for (const ds of datasets) {
        const row = document.createElement('div');
        row.className = 'dataset-row' + (selectedDatasetId === ds.id ? ' selected' : '');
        row.innerHTML = `
            <button class="dataset-select-btn" data-id="${ds.id}">
                <span class="dataset-name">${escHtml(ds.name)}</span>
                <span class="dataset-meta">${datasetStats(ds)}</span>
            </button>
            <div class="dataset-actions">
                <button class="btn-icon" title="Edytuj" data-edit="${ds.id}">✎</button>
                <button class="btn-icon btn-icon-danger" title="Usuń" data-delete="${ds.id}">✕</button>
            </div>
        `;
        container.appendChild(row);
    }

    container.querySelectorAll('.dataset-select-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedDatasetId = btn.dataset.id;
            renderDatasetList();
            updateFooter();
        });
    });
    container.querySelectorAll('[data-edit]').forEach(btn => {
        btn.addEventListener('click', () => openDatasetEditor(btn.dataset.edit));
    });
    container.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!confirm('Na pewno usunąć ten zestaw?')) return;
            datasetsRemove(btn.dataset.delete);
            if (selectedDatasetId === btn.dataset.delete) selectedDatasetId = null;
            renderDatasetList();
            updateFooter();
        });
    });
}

function updateFooter() {
    const algo = ALGORITHMS.find(a => a.id === selectedAlgoId);
    const ds   = selectedDatasetId ? datasetsGetById(selectedDatasetId) : null;
    document.getElementById('summary-algo').innerHTML    = `Algorytm: <em>${algo ? algo.name : 'nie wybrano'}</em>`;
    document.getElementById('summary-dataset').innerHTML = `Zestaw: <em>${ds ? escHtml(ds.name) : 'nie wybrano'}</em>`;
    document.getElementById('btn-run').disabled = !(selectedAlgoId && selectedDatasetId);
}

// ── Edytor zestawu danych ───────────────────────────────────────

function openDatasetEditor(id) {
    editingDatasetId = id || null;
    const dataset    = id ? datasetsGetById(id) : null;
    initMapEditor(dataset);
    showView('view-editor');
}

document.getElementById('btn-new-dataset').addEventListener('click', () => openDatasetEditor(null));

document.getElementById('btn-editor-cancel').addEventListener('click', () => {
    showView('view-menu');
});

document.getElementById('btn-editor-save').addEventListener('click', () => {
    const data = getMapData();
    if (editingDatasetId) {
        datasetsUpdate(editingDatasetId, data);
    } else {
        const created = datasetsCreate(data);
        editingDatasetId = created.id;
    }
    showView('view-menu');
    renderDatasetList();
    updateFooter();
});

// ── Runner ──────────────────────────────────────────────────────

document.getElementById('btn-run').addEventListener('click', () => {
    if (selectedAlgoId && selectedDatasetId) {
        openRunner(selectedAlgoId, selectedDatasetId);
    }
});

function openRunner(algoId, datasetId) {
    const algo = ALGORITHMS.find(a => a.id === algoId);
    document.getElementById('runner-algo-name').textContent = algo.name;

    const select = document.getElementById('runner-dataset-select');
    select.innerHTML = '';
    for (const ds of datasetsGetAll()) {
        const opt = document.createElement('option');
        opt.value       = ds.id;
        opt.textContent = ds.name;
        opt.selected    = ds.id === datasetId;
        select.appendChild(opt);
    }

    resetRunner();
    showView('view-runner');
}

function resetRunner() {
    document.getElementById('log-output').innerHTML = '<p class="log-placeholder">Naciśnij "▶ Uruchom" aby rozpocząć obliczenia...</p>';
    document.getElementById('log-status').textContent = '';
    document.getElementById('log-actions').classList.add('hidden');
    document.getElementById('viz-section').classList.add('hidden');
    document.getElementById('map-viz-section').classList.add('hidden');
}

document.getElementById('btn-back').addEventListener('click', () => showView('view-menu'));

document.getElementById('btn-execute').addEventListener('click', () => {
    const algoId    = selectedAlgoId;
    const datasetId = document.getElementById('runner-dataset-select').value;
    const out       = document.getElementById('log-output');
    const btnExec   = document.getElementById('btn-execute');

    out.innerHTML = '';
    document.getElementById('log-status').textContent = 'obliczanie...';
    document.getElementById('log-actions').classList.add('hidden');
    document.getElementById('viz-section').classList.add('hidden');
    document.getElementById('map-viz-section').classList.add('hidden');
    btnExec.disabled = true;

    runAlgorithm(algoId, datasetId,
        function(line) {
            const p = document.createElement('p');
            p.className = (line.includes('══') || line.includes('──')) ? 'log-line log-separator' : 'log-line';
            p.textContent = line;
            out.appendChild(p);
            out.scrollTop = out.scrollHeight;
        },
        function(logs, assignments) {
            document.getElementById('log-status').textContent = `gotowe · ${logs.length} linii`;
            btnExec.disabled = false;
            document.getElementById('log-actions').classList.remove('hidden');
            renderBipartiteGraph(datasetId, assignments);
            renderMapViz(datasetId, assignments);
        }
    );
});

document.getElementById('btn-download-logs').addEventListener('click', () => {
    const ds   = datasetsGetById(document.getElementById('runner-dataset-select').value);
    const algo = ALGORITHMS.find(a => a.id === selectedAlgoId);
    downloadLogs(`${algo?.shortName ?? 'wyniki'}_${ds?.name ?? ''}.txt`);
});

document.getElementById('btn-about').addEventListener('click', () => {
    const algo = ALGORITHMS.find(a => a.id === selectedAlgoId);
    if (!algo) return;
    document.getElementById('modal-algo-name').textContent       = algo.name;
    document.getElementById('modal-algo-desc').textContent       = algo.description;
    document.getElementById('modal-time-complexity').textContent  = algo.complexity;
    document.getElementById('modal-space-complexity').textContent = algo.spaceComplexity;

    const stepsList = document.getElementById('modal-algo-steps');
    stepsList.innerHTML = '';
    for (const step of algo.steps) {
        const li = document.createElement('li');
        li.textContent = step;
        stepsList.appendChild(li);
    }
    document.getElementById('modal-about').classList.remove('hidden');
});

// ═══════════════════════════════════════════════════════════════
// WIZUALIZACJA — GRAF PRZYDZIAŁÓW (dwudzielny)
// ═══════════════════════════════════════════════════════════════

function renderBipartiteGraph(datasetId, assignments) {
    const dataset = datasetsGetById(datasetId);
    if (!dataset || !assignments || assignments.length === 0) return;

    const NS  = 'http://www.w3.org/2000/svg';
    const svg = document.getElementById('viz-svg');

    function el(tag, attrs, text) {
        const node = document.createElementNS(NS, tag);
        for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
        if (text !== undefined) node.textContent = text;
        return node;
    }

    // Słowniki id → obiekt
    const houseMap = {};
    for (const h of dataset.houses) houseMap[h.id] = h;
    const mineMap = {};
    for (const m of dataset.mines) mineMap[m.id] = m;

    // Rozwiń przydziały do poziomu pojedynczych krasnoludków
    // Backend zwraca count per (domek, kopalnia) — przypisujemy krasnoludki po kolei
    const dwarfRows = []; // [{dwarfName, dwarfPrefs, mineId, distance}]
    const houseNextDwarf = {}; // houseId → indeks następnego wolnego krasnoludka

    for (const a of assignments) {
        const house  = houseMap[a.houseId];
        const dwarfs = house?.dwarfs || [];
        if (!houseNextDwarf[a.houseId]) houseNextDwarf[a.houseId] = 0;

        for (let k = 0; k < a.count; k++) {
            const idx   = houseNextDwarf[a.houseId]++;
            const dwarf = dwarfs[idx];
            dwarfRows.push({
                dwarfName:  dwarf ? dwarf.name : `Krasnoludek ${idx + 1}`,
                dwarfPrefs: dwarf ? (dwarf.mineralPreferences || []) : [],
                mineId:     a.mineId,
                distance:   a.distance,
            });
        }
    }

    // Sortuj krasnoludki i kopalnie wg minerału (mniej skrzyżowań)
    const sortedMines = [...dataset.mines].sort((a, b) =>
        (a.mineral || a.mineralType || '').localeCompare(b.mineral || b.mineralType || ''));
    dwarfRows.sort((a, b) => {
        const ma = mineMap[a.mineId]?.mineral || '';
        const mb = mineMap[b.mineId]?.mineral || '';
        return ma.localeCompare(mb);
    });

    const mineIdx = {};
    for (let i = 0; i < sortedMines.length; i++) mineIdx[sortedMines[i].id] = i;

    const ROW  = 36;
    const svgW = svg.parentElement.clientWidth || 700;
    const svgH = Math.max(280, Math.max(dwarfRows.length, sortedMines.length) * ROW + 60);
    const lx   = 200, rx = svgW - 200, nr = 9;

    svg.setAttribute('width', '100%');
    svg.setAttribute('height', svgH);
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.innerHTML = '';

    function dY(i) { return 40 + i * ROW; }
    function mY(i) { return 40 + i * ROW; }

    const assignedMines = new Set(assignments.map(a => a.mineId));

    // Nagłówki
    svg.appendChild(el('text', { x: lx, y: 18, 'text-anchor': 'middle', 'font-size': '9', fill: '#c9a84c', 'font-family': 'Georgia,serif', 'letter-spacing': '1' }, 'KRASNOLUDKI'));
    svg.appendChild(el('text', { x: rx, y: 18, 'text-anchor': 'middle', 'font-size': '9', fill: '#c9a84c', 'font-family': 'Georgia,serif', 'letter-spacing': '1' }, 'KOPALNIE'));

    // Linie (proste, kolor = mineral kopalni)
    for (let i = 0; i < dwarfRows.length; i++) {
        const row   = dwarfRows[i];
        const mi    = mineIdx[row.mineId];
        if (mi === undefined) continue;
        const mine  = mineMap[row.mineId];
        const color = MINERAL_COLORS[mine?.mineral || mine?.mineralType] || '#d97706';
        svg.appendChild(el('line', {
            x1: lx + nr, y1: dY(i),
            x2: rx - nr, y2: mY(mi),
            stroke: color, 'stroke-width': '1.5', opacity: '0.5',
        }));
    }

    // Krasnoludki (kółka po lewej)
    for (let i = 0; i < dwarfRows.length; i++) {
        const row     = dwarfRows[i];
        const y       = dY(i);
        const mine    = mineMap[row.mineId];
        const mineral = mine?.mineral || mine?.mineralType || '?';
        const color   = MINERAL_COLORS[mineral] || '#d97706';

        svg.appendChild(el('circle', { cx: lx, cy: y, r: nr, fill: '#4a2800', stroke: color, 'stroke-width': '1.5' }));

        // Imię krasnoludka po lewej
        svg.appendChild(el('text', { x: lx - nr - 7, y: y - 2, 'text-anchor': 'end', 'font-size': '10', fill: '#e8d5a3', 'font-family': 'Georgia,serif' }, row.dwarfName));

        // Mineral + dystans pod imieniem
        svg.appendChild(el('circle', { cx: lx - nr - 12, cy: y + 7, r: 3, fill: color }));
        svg.appendChild(el('text',   { x: lx - nr - 17, y: y + 10, 'text-anchor': 'end', 'font-size': '8', fill: color, 'font-family': 'Georgia,serif' },
            `${mineral} · ~${Math.round(row.distance)}px`));
    }

    // Kopalnie (romby po prawej, kolor = mineral)
    for (let i = 0; i < sortedMines.length; i++) {
        const m       = sortedMines[i];
        const y       = mY(i);
        const mineral = m.mineral || m.mineralType || '?';
        const color   = MINERAL_COLORS[mineral] || '#94a3b8';
        const ok      = assignedMines.has(m.id);

        svg.appendChild(el('path', {
            d: `M ${rx} ${y-nr} L ${rx+nr} ${y} L ${rx} ${y+nr} L ${rx-nr} ${y} Z`,
            fill: color + (ok ? 'bb' : '33'), stroke: color, 'stroke-width': ok ? '2' : '1', opacity: ok ? '1' : '0.4',
        }));
        svg.appendChild(el('text', { x: rx + nr + 8, y: y - 1, 'font-size': '10', fill: ok ? '#e8d5a3' : '#8a7050', 'font-family': 'Georgia,serif' }, m.name || `Kopalnia ${m.id}`));
        svg.appendChild(el('text', { x: rx + nr + 8, y: y + 11, 'font-size': '8',  fill: color, 'font-family': 'Georgia,serif' }, mineral));
    }

    svg.appendChild(el('text', { x: svgW / 2, y: svgH - 6, 'text-anchor': 'middle', 'font-size': '9', fill: '#8a7050', 'font-family': 'Georgia,serif' }, `Łączny dystans: ${Math.round(lastTotalDist)}px`));

    document.getElementById('viz-section').classList.remove('hidden');
}

// ═══════════════════════════════════════════════════════════════
// WIZUALIZACJA — MAPA KRÓLESTWA
// ═══════════════════════════════════════════════════════════════

const MINERAL_COLORS = {
    'Złoto': '#f59e0b', 'Węgiel': '#78716c', 'Miedź': '#c2410c',
    'Srebro': '#94a3b8', 'Żelazo': '#64748b', 'Diament': '#67e8f9',
};

function renderMapViz(datasetId, assignments) {
    const dataset = datasetsGetById(datasetId);
    const section = document.getElementById('map-viz-section');

    if (!dataset || !dataset.border || dataset.border.length < 3 || !assignments || assignments.length === 0) {
        section.classList.add('hidden');
        return;
    }

    const svg = document.getElementById('map-viz-svg');
    svg.innerHTML = '';
    const NS = 'http://www.w3.org/2000/svg';

    function el(tag, attrs, text) {
        const node = document.createElementNS(NS, tag);
        for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
        if (text !== undefined) node.textContent = text;
        return node;
    }

    // Definicje — gradienty i wzory tła
    const defs = document.createElementNS(NS, 'defs');

    const parchment = el('radialGradient', { id: 'mvp', cx: '50%', cy: '50%', r: '70%' });
    parchment.appendChild(el('stop', { offset: '0%',   'stop-color': '#f5e6c0' }));
    parchment.appendChild(el('stop', { offset: '60%',  'stop-color': '#e8d5a0' }));
    parchment.appendChild(el('stop', { offset: '100%', 'stop-color': '#c9b880' }));
    defs.appendChild(parchment);

    const grass = el('pattern', { id: 'mvg', width: '12', height: '12', patternUnits: 'userSpaceOnUse' });
    grass.appendChild(el('path', { d: 'M0,12 L12,0', stroke: '#5a7a3a', 'stroke-width': '0.6', opacity: '0.3' }));
    defs.appendChild(grass);

    const vignette = el('radialGradient', { id: 'mvv', cx: '50%', cy: '50%', r: '70%' });
    vignette.appendChild(el('stop', { offset: '60%',  'stop-color': 'transparent' }));
    vignette.appendChild(el('stop', { offset: '100%', 'stop-color': 'rgba(30,15,0,0.5)' }));
    defs.appendChild(vignette);

    svg.appendChild(defs);
    svg.appendChild(el('rect', { width: 900, height: 650, fill: 'url(#mvp)' }));

    // Granica królestwa
    let borderPath = '';
    for (let i = 0; i < dataset.border.length; i++) {
        borderPath += (i === 0 ? 'M' : 'L') + dataset.border[i].x + ',' + dataset.border[i].y + ' ';
    }
    borderPath += 'Z';
    svg.appendChild(el('path', { d: borderPath, fill: 'url(#mvg)' }));
    svg.appendChild(el('path', { d: borderPath, fill: 'rgba(80,120,50,0.18)' }));
    svg.appendChild(el('path', { d: borderPath, fill: 'none', stroke: '#4a2800', 'stroke-width': '3.5', 'stroke-linejoin': 'round' }));
    svg.appendChild(el('path', { d: borderPath, fill: 'none', stroke: '#8b5e0a', 'stroke-width': '1.5', 'stroke-linejoin': 'round' }));

    // Słowniki id → obiekt
    const houseMap = {};
    for (const h of dataset.houses) houseMap[h.id] = h;
    const mineMap = {};
    for (const m of dataset.mines)  mineMap[m.id]  = m;

    const maxCount = Math.max(...assignments.map(a => a.count), 1);

    // Linie przydziałów (rysowane przed ikonami, żeby były pod spodem)
    for (const a of assignments) {
        const h = houseMap[a.houseId];
        const m = mineMap[a.mineId];
        if (!h || !m) continue;

        const color = MINERAL_COLORS[m.mineral || m.mineralType] || '#d97706';
        const sw    = 2 + (a.count / maxCount) * 4;
        const midX  = (h.x + m.x) / 2;
        const midY  = (h.y + m.y) / 2;

        svg.appendChild(el('line', { x1: h.x, y1: h.y, x2: m.x, y2: m.y, stroke: color, 'stroke-width': sw, 'stroke-dasharray': '8 4', opacity: '0.65', 'stroke-linecap': 'round' }));
        svg.appendChild(el('circle', { cx: midX, cy: midY, r: '11', fill: 'rgba(20,10,0,0.85)', stroke: color, 'stroke-width': '1.5' }));
        svg.appendChild(el('text',   { x: midX, y: midY + 4, 'text-anchor': 'middle', 'font-size': '11', fill: color, 'font-family': 'serif', 'font-weight': 'bold', 'pointer-events': 'none' }, a.count));
    }

    // Ikony domków
    const assignedHouses = new Set(assignments.map(a => a.houseId));
    for (const h of dataset.houses) {
        if (!h.x && !h.y) continue;
        const ok = assignedHouses.has(h.id);
        const g  = document.createElementNS(NS, 'g');
        g.setAttribute('transform', `translate(${h.x},${h.y})`);
        g.appendChild(el('rect',    { x: -13, y: -8, width: 26, height: 16, fill: ok ? '#8b6914' : '#4a3000', stroke: '#4a3000', 'stroke-width': '1.5', rx: '1' }));
        g.appendChild(el('polygon', { points: '0,-22 -15,-8 15,-8', fill: ok ? '#5c1a0a' : '#2a0a00', stroke: '#3b0a00', 'stroke-width': '1.5' }));
        g.appendChild(el('rect',    { x: -4, y: -1, width: 8, height: 9, fill: '#2c1a00', rx: '1' }));
        if (ok) g.appendChild(el('rect', { x: 5, y: -5, width: 5, height: 5, fill: '#fde68a', opacity: '0.8', rx: '0.5' }));
        g.appendChild(el('rect', { x: -28, y: 12, width: 56, height: 13, rx: '3', fill: 'rgba(30,15,0,0.75)' }));
        g.appendChild(el('text', { y: 22, 'text-anchor': 'middle', 'font-size': '9', fill: '#fde68a', 'font-family': 'serif', 'font-weight': 'bold', 'pointer-events': 'none' }, h.name || `D${h.id}`));
        svg.appendChild(g);
    }

    // Ikony kopalni
    const assignedMines = new Set(assignments.map(a => a.mineId));
    for (const m of dataset.mines) {
        if (!m.x && !m.y) continue;
        const color = MINERAL_COLORS[m.mineral || m.mineralType] || '#94a3b8';
        const ok    = assignedMines.has(m.id);
        const g     = document.createElementNS(NS, 'g');
        g.setAttribute('transform', `translate(${m.x},${m.y})`);
        g.appendChild(el('rect',   { x: -13, y: -4, width: 26, height: 14, fill: '#1c1412', stroke: '#4a3000', 'stroke-width': '1.5', rx: '2' }));
        g.appendChild(el('path',   { d: 'M-13,-4 Q0,-18 13,-4', fill: '#2c1a00', stroke: '#4a3000', 'stroke-width': '1.5' }));
        g.appendChild(el('line',   { x1: -7, y1: -10, x2:  7, y2: 10, stroke: color, 'stroke-width': '2', 'stroke-linecap': 'round', opacity: ok ? '0.9' : '0.3' }));
        g.appendChild(el('line',   { x1:  7, y1: -10, x2: -7, y2: 10, stroke: color, 'stroke-width': '2', 'stroke-linecap': 'round', opacity: ok ? '0.9' : '0.3' }));
        g.appendChild(el('circle', { r: '3.5', fill: color, opacity: ok ? '0.95' : '0.3' }));
        g.appendChild(el('rect',   { x: -22, y: 12, width: 44, height: 13, rx: '3', fill: 'rgba(30,15,0,0.75)' }));
        g.appendChild(el('text',   { y: 22, 'text-anchor': 'middle', 'font-size': '9', fill: '#fde68a', 'font-family': 'serif', 'font-weight': 'bold', 'pointer-events': 'none' }, m.mineral || m.mineralType || '?'));
        svg.appendChild(g);
    }

    svg.appendChild(el('rect', { width: 900, height: 650, fill: 'url(#mvv)', 'pointer-events': 'none' }));
    section.classList.remove('hidden');
}

// ═══════════════════════════════════════════════════════════════
// NARZĘDZIA
// ═══════════════════════════════════════════════════════════════

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ═══════════════════════════════════════════════════════════════
// INICJALIZACJA
// ═══════════════════════════════════════════════════════════════

seedDefaults();
renderAlgoList();
renderDatasetList();
updateFooter();
