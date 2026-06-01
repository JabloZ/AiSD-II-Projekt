import { initMapEditor, getMapData } from './js/mapEditor.js';

// ═══════════════════════════════════════════════════════════════
// ALGORYTMY
// ═══════════════════════════════════════════════════════════════

const ALGORITHMS = [
    {
        id: 'mcmf',
        name: 'Min-Cost Max-Flow',
        shortName: 'MCMF',
        complexity: 'O(F·E·V)',
        spaceComplexity: 'O(V + E)',
        description: 'Najoptymalniejsze przypisanie krasnoludków do kopalni metodą sieci przepływowych. Maksymalizuje liczbę zatrudnionych krasnoludków (Max Flow) minimalizując jednocześnie łączny dystans z domów do kopalni (Min Cost). Do szukania najkrótszych ścieżek w sieci rezydualnej używany jest algorytm Bellmana-Forda, który obsługuje ujemne wagi krawędzi powrotnych.',
        steps: [
            'Zbuduj sieć przepływową: Źródło → Krasnoludek (cap=1, cost=0)',
            'Dodaj krawędzie Krasnoludek → Kopalnia (cap=1, cost=dystans) — tylko dla zgodnych minerałów',
            'Dodaj krawędzie Kopalnia → Ujście (cap=pojemność kopalni, cost=0)',
            'Każda krawędź dostaje rezydualną z kosztem odwrotnym (-cost), co pozwala cofać błędne decyzje',
            'Szukaj najtańszej ścieżki Źródło → Ujście algorytmem Bellmana-Forda (maks. V-1 relaksacji)',
            'Jeśli nie ma ścieżki (dist[Sink] = ∞) — algorytm kończy pracę, przydział jest optymalny',
            'W przeciwnym razie: wyznacz wąskie gardło ścieżki i wypchnij przepływ, aktualizując graf rezydualny',
            'Na podstawie krawędzi z Flow > 0 przypisz krasnoludom konkretne kopalnie',
        ],
    },
    {
        id: 'patrol',
        name: 'Patrol Solver (Graham Scan)',
        shortName: 'Patrol',
        complexity: 'O(n log n)',
        spaceComplexity: 'O(n)',
        description: 'Wyznacza optymalną trasę patrolową obejmującą wszystkie domki i kopalnie na mapie. Algorytm Grahama oblicza wypukłą otoczkę (convex hull) zbioru punktów — najkrótszy wielokąt wypukły zawierający wszystkie obiekty. Strażnicy patrolujący tę trasę zapewniają nadzór nad całym terenem przy minimalnej długości trasy granicznej.',
        steps: [
            'Zbierz wszystkie domki i kopalnie jako punkty na płaszczyźnie',
            'Znajdź pivot: punkt najniżej położony na mapie (przy remisie — najbardziej wysunięty w lewo)',
            'Posortuj pozostałe punkty według kąta biegunowego względem pivota (sortowanie kątowe)',
            'Jeśli dwa punkty leżą na tej samej prostej co pivot, zostaw tylko ten najdalszy',
            'Inicjalizuj stos: wrzuć pivot i dwa pierwsze punkty po sortowaniu',
            'Dla każdego kolejnego punktu: dopóki trójka (przedostatni, ostatni na stosie, nowy punkt) skręca w prawo lub jest współliniowa — zdejmuj ze stosu',
            'Wrzuć nowy punkt na stos — gwarantuje to wyłącznie lewoskręty',
            'Punkty pozostałe na stosie tworzą wypukłą otoczkę — trasę patrolową',
        ],
    },
    {
        id: 'border-defense',
        name: 'Border Defense Solver (Segment Tree)',
        shortName: 'BorderDef',
        complexity: 'O(n log n)',
        spaceComplexity: 'O(n)',
        description: 'Organizuje obronę granicy królestwa przy użyciu drzewa przedziałowego (Segment Tree). Krasnoludki rozmieszczone wzdłuż granicy mają różne wartości głośności — im głośniejszy krasnoludek, tym skuteczniej dowodzi sąsiednimi strażnikami. Drzewo przedziałowe umożliwia błyskawiczne (O(log n)) znajdowanie najgłośniejszego dowódcy dla dowolnego odcinka muru.',
        steps: [
            'Umieść krasnoludki wzdłuż kolejnych wierzchołków granicy królestwa',
            'Zbuduj drzewo przedziałowe (Segment Tree) na liście krasnoludków w czasie O(n)',
            'Każdy liść drzewa odpowiada jednemu krasnoludkowi na murze',
            'Każdy węzeł wewnętrzny przechowuje krasnoludka o największej głośności z całego poddrzewa',
            'Podziel mur na segmenty obronne (co 3 wierzchołki granicy)',
            'Dla każdego segmentu wykonaj zapytanie przedziałowe Query(L, R) w czasie O(log n)',
            'Zapytanie zwraca najgłośniejszego krasnoludka z danego odcinka — zostaje on dowódcą segmentu',
            'Wyświetl przypisania: segment muru → imię i głośność dowódcy',
        ],
    },
];

// ═══════════════════════════════════════════════════════════════
// DANE Z BAZY
// ═══════════════════════════════════════════════════════════════

const API_URL = 'http://localhost:8001';

let currentDbData  = null; // surowe dane z GET /api/data
let currentVizData = null; // przekształcone do formatu edytora/wizualizacji

let activeDatasetName  = 'zbior1';
let activeDatasetLabel = 'Zbiór przykładowy';

async function loadDbData() {
    try {
        const res = await fetch(`${API_URL}/api/data`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        currentDbData  = await res.json();
        currentVizData = dbToVizFormat(currentDbData);
    } catch (e) {
        console.error('Błąd ładowania danych z bazy:', e);
        currentDbData  = null;
        currentVizData = null;
    }
}

// Przekształca format z GET /api/data → format używany przez edytor i wizualizacje
function dbToVizFormat(db) {
    if (!db) return null;

    const mineralById = {};
    for (const m of (db.minerals || [])) mineralById[m.id] = m.name;

    const dwarfsByHouseId = {};
    for (const d of (db.dwarfs || [])) {
        if (!dwarfsByHouseId[d.houseId]) dwarfsByHouseId[d.houseId] = [];
        dwarfsByHouseId[d.houseId].push({
            id:   String(d.id),
            name: d.name,
            mineralPreferences: Object.keys(d.preferences || {})
                .map(k => mineralById[parseInt(k)] || k),
        });
    }

    return {
        border: (db.border || []).map(p => ({ x: p.x ?? p.X, y: p.y ?? p.Y })),
        houses: (db.houses || []).map(h => ({
            id:    String(h.id),
            x:     h.x,
            y:     h.y,
            name:  `Domek ${h.id}`,
            dwarfs: dwarfsByHouseId[h.id] || [],
        })),
        mines: (db.deposits || []).map(d => ({
            id:       String(d.id),
            x:        d.x,
            y:        d.y,
            mineral:  d.mineralName || mineralById[d.mineralId] || '?',
            capacity: d.capacity,
        })),
    };
}

// ═══════════════════════════════════════════════════════════════
// RUNNER
// ═══════════════════════════════════════════════════════════════

let lastLogs        = [];
let lastAssignments = [];
let lastTotalDist   = 0;

async function runAlgorithm(algoId, onLog, onDone) {
    lastLogs        = [];
    lastAssignments = [];
    lastTotalDist   = 0;

    const algo = ALGORITHMS.find(a => a.id === algoId);

    if (algoId === 'patrol') {
        await runPatrolSolver(onLog, onDone);
        return;
    }
    if (algoId === 'border-defense') {
        await runBorderDefenseSolver(onLog, onDone);
        return;
    }

    // MCMF — oryginalna logika
    const algoMap = { hungarian: 'mcmf', greedy: 'greedy', random: 'random' };
    const algoKey = algoMap[algoId] || 'mcmf';

    onLog(`[lokalne] Wysyłam żądanie: ${algo.name}`);

    try {
        const response = await fetch(`${API_URL}/api/assign-from-db?algorithm=${algoKey}`);
        if (!response.ok) {
            const text = await response.text();
            onLog(`BŁĄD HTTP ${response.status}: ${text}`);
            onDone([], []);
            return;
        }

        const data    = await response.json();
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

// ═══════════════════════════════════════════════════════════════
// PATROL SOLVER — Graham Scan (wypukła otoczka)
// ═══════════════════════════════════════════════════════════════

async function runPatrolSolver(onLog, onDone) {
    const ts = () => new Date().toLocaleTimeString('pl-PL', { hour12: false });

    function log(msg) {
        lastLogs.push(msg);
        onLog(msg);
    }

    log(`[${ts()}] Algorytm: Patrol Solver (Graham Scan)`);
    log(`[${ts()}] ──────────────────────────────────────────`);

    if (!currentVizData) {
        log(`[${ts()}] BŁĄD: Brak danych z bazy — nie można uruchomić algorytmu.`);
        onDone(lastLogs, []);
        return;
    }

    const { houses, mines } = currentVizData;
    const allPoints = [
        ...houses.map(h => ({ x: Math.round(h.x), y: Math.round(h.y), label: h.name || `Domek ${h.id}`, type: 'house', id: h.id })),
        ...mines.map(m  => ({ x: Math.round(m.x), y: Math.round(m.y), label: `Kopalnia (${m.mineral})`, type: 'mine', id: m.id })),
    ].filter(p => p.x != null && p.y != null);

    log(`[${ts()}] Punkty wejściowe: ${allPoints.length} (${houses.length} domków + ${mines.length} kopalni)`);

    if (allPoints.length < 3) {
        log(`[${ts()}] Za mało punktów (minimum 3) — nie można wyznaczyć otoczki.`);
        onDone(lastLogs, []);
        return;
    }

    // Krok 1 — pivot
    let pivotIdx = 0;
    for (let i = 1; i < allPoints.length; i++) {
        const p = allPoints[i], best = allPoints[pivotIdx];
        if (p.y > best.y || (p.y === best.y && p.x < best.x)) pivotIdx = i;
    }
    const tmp = allPoints[0]; allPoints[0] = allPoints[pivotIdx]; allPoints[pivotIdx] = tmp;
    const pivot = allPoints[0];
    log(`[${ts()}] Pivot (najniżej): ${pivot.label} (${pivot.x}, ${pivot.y})`);

    // Krok 2 — sortowanie kątowe
    function cross(o, a, b) { return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x); }
    function dist2(a, b)    { return (a.x - b.x) ** 2 + (a.y - b.y) ** 2; }

    const rest = allPoints.slice(1).sort((a, b) => {
        const c = cross(pivot, a, b);
        if (c !== 0) return c < 0 ? 1 : -1;
        return dist2(pivot, a) - dist2(pivot, b);
    });

    // Usuń współliniowe — zostaw tylko najdalszy
    const filtered = [pivot];
    for (let i = 0; i < rest.length; i++) {
        while (i < rest.length - 1 && cross(pivot, rest[i], rest[i + 1]) === 0) i++;
        filtered.push(rest[i]);
    }

    log(`[${ts()}] Po sortowaniu kątowym i usunięciu współliniowych: ${filtered.length} punktów`);

    if (filtered.length < 3) {
        log(`[${ts()}] Wszystkie punkty współliniowe — otoczka zdegenerowana.`);
        onDone(lastLogs, []);
        return;
    }

    // Krok 3 — stos Grahama
    const stack = [filtered[0], filtered[1], filtered[2]];
    for (let i = 3; i < filtered.length; i++) {
        while (stack.length > 1 && cross(stack[stack.length - 2], stack[stack.length - 1], filtered[i]) <= 0) {
            stack.pop();
        }
        stack.push(filtered[i]);
    }

    log(`[${ts()}] ══════════════════════════════════════════`);
    log(`[${ts()}] Trasa patrolowa (${stack.length} punktów):`);

    let totalLen = 0;
    for (let i = 0; i < stack.length; i++) {
        const next = stack[(i + 1) % stack.length];
        const seg  = Math.sqrt(dist2(stack[i], next));
        totalLen  += seg;
        log(`[${ts()}]   ${i + 1}. ${stack[i].label} (${stack[i].x}, ${stack[i].y}) → ${next.label} [${Math.round(seg)} px]`);
    }
    log(`[${ts()}] Łączna długość trasy: ${Math.round(totalLen)} px`);
    log(`[${ts()}] Punkty wewnątrz (chronione): ${allPoints.length - stack.length}`);

    onDone(lastLogs, stack);
}

// ═══════════════════════════════════════════════════════════════
// BORDER DEFENSE SOLVER — Segment Tree
// ═══════════════════════════════════════════════════════════════

async function runBorderDefenseSolver(onLog, onDone) {
    const ts = () => new Date().toLocaleTimeString('pl-PL', { hour12: false });

    function log(msg) {
        lastLogs.push(msg);
        onLog(msg);
    }

    log(`[${ts()}] Algorytm: Border Defense Solver (Segment Tree)`);
    log(`[${ts()}] ──────────────────────────────────────────`);

    if (!currentVizData) {
        log(`[${ts()}] BŁĄD: Brak danych z bazy — nie można uruchomić algorytmu.`);
        onDone(lastLogs, []);
        return;
    }

    const { border, houses } = currentVizData;

    if (!border || border.length < 3) {
        log(`[${ts()}] BŁĄD: Granica królestwa ma za mało wierzchołków (minimum 3).`);
        onDone(lastLogs, []);
        return;
    }

    // Zbierz wszystkich krasnoludków z domków
    const allDwarfs = [];
    for (const h of houses) {
        for (const d of (h.dwarfs || [])) {
            allDwarfs.push({ ...d, houseName: h.name || `Domek ${h.id}` });
        }
    }

    if (allDwarfs.length === 0) {
        log(`[${ts()}] BŁĄD: Brak krasnoludków w bazie danych.`);
        onDone(lastLogs, []);
        return;
    }

    // Przypisz głośność (losowa ale deterministyczna na bazie id)
    const dwarfsOnBorder = allDwarfs.map((d, i) => ({
        ...d,
        borderIdx: i % border.length,
        loudness: (d.name.charCodeAt(0) % 10) + (d.name.length % 5) + 1,
    }));

    log(`[${ts()}] Wierzchołki granicy: ${border.length}`);
    log(`[${ts()}] Krasnoludki na murze: ${dwarfsOnBorder.length}`);
    log(`[${ts()}] Budowanie drzewa przedziałowego (Segment Tree)...`);

    const n = dwarfsOnBorder.length;

    // Budowa Segment Tree
    const tree = new Array(4 * n).fill(null);

    function build(node, start, end) {
        if (start === end) {
            tree[node] = dwarfsOnBorder[start];
            return;
        }
        const mid = (start + end) >> 1;
        build(2 * node, start, mid);
        build(2 * node + 1, mid + 1, end);
        tree[node] = tree[2 * node].loudness >= tree[2 * node + 1].loudness
            ? tree[2 * node]
            : tree[2 * node + 1];
    }

    function query(node, start, end, L, R) {
        if (R < start || L > end) return null;
        if (L <= start && end <= R) return tree[node];
        const mid = (start + end) >> 1;
        const left  = query(2 * node,     start, mid,     L, R);
        const right = query(2 * node + 1, mid + 1, end,   L, R);
        if (!left)  return right;
        if (!right) return left;
        return left.loudness >= right.loudness ? left : right;
    }

    build(1, 0, n - 1);
    log(`[${ts()}] Drzewo zbudowane — ${n} liści, ${Math.ceil(Math.log2(n)) + 1} poziomów`);

    // Podziel mur na segmenty (co ~3 krasnoludki)
    const SEGMENT_SIZE = Math.max(1, Math.ceil(n / Math.ceil(n / 3)));
    const segments = [];

    for (let L = 0; L < n; L += SEGMENT_SIZE) {
        const R = Math.min(L + SEGMENT_SIZE - 1, n - 1);
        const commander = query(1, 0, n - 1, L, R);
        segments.push({ L, R, commander });
    }

    log(`[${ts()}] ══════════════════════════════════════════`);
    log(`[${ts()}] Przydział dowódców segmentów muru:`);

    for (let i = 0; i < segments.length; i++) {
        const { L, R, commander } = segments[i];
        const vStart = dwarfsOnBorder[L].borderIdx;
        const vEnd   = dwarfsOnBorder[R].borderIdx;
        log(`[${ts()}]   Segment ${i + 1} [krasnoludki ${L + 1}–${R + 1}, wierzchołki ${vStart + 1}–${vEnd + 1}]:`);
        log(`[${ts()}]     Dowódca: ${commander.name} (głośność: ${commander.loudness}) — ${commander.houseName}`);
    }

    log(`[${ts()}] Segmentów obrony: ${segments.length}`);
    log(`[${ts()}] Krasnoludków na murze: ${n}`);

    onDone(lastLogs, segments);
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

let selectedAlgoId = 'mcmf';

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

// ── Statystyki danych z bazy ────────────────────────────────────

function renderDbStats() {
    const el = document.getElementById('db-stats');
    if (!currentDbData) {
        el.innerHTML = '<p class="empty-msg">Błąd połączenia z bazą danych.</p>';
        return;
    }
    const houses  = (currentDbData.houses   || []).length;
    const dwarfs  = (currentDbData.dwarfs   || []).length;
    const deposits = (currentDbData.deposits || []).length;
    el.innerHTML = `
        <div class="stats-grid" style="margin-top:10px">
            <span class="stat-label">Domki</span>    <span class="stat-value">${houses}</span>
            <span class="stat-label">Krasnoludki</span><span class="stat-value">${dwarfs}</span>
            <span class="stat-label">Kopalnie</span> <span class="stat-value">${deposits}</span>
        </div>
    `;
}

function updateFooter() {
    const algo = ALGORITHMS.find(a => a.id === selectedAlgoId);
    document.getElementById('summary-dataset').innerHTML = `Zbiór: <em>${escHtml(activeDatasetLabel)}</em>`;
    document.getElementById('summary-algo').innerHTML    = `Algorytm: <em>${algo ? algo.name : 'nie wybrano'}</em>`;
    document.getElementById('btn-run').disabled = !selectedAlgoId;
}

async function renderDatasetList() {
    const container = document.getElementById('dataset-list');
    try {
        const res  = await fetch(`${API_URL}/api/datasets`);
        const data = await res.json();
        activeDatasetName  = data.active;

        container.innerHTML = '';
        for (const ds of data.datasets) {
            const isActive = ds.name === data.active;
            if (isActive) activeDatasetLabel = ds.label;

            const item = document.createElement('div');
            item.className = 'dataset-row' + (isActive ? ' selected' : '');
            item.innerHTML = `
                <div class="dataset-select-btn">
                    <span class="dataset-name">${escHtml(ds.label)}</span>
                    <span class="dataset-meta">${isActive ? '● aktywny' : ds.name}</span>
                </div>
                <div class="dataset-actions">
                    ${!isActive ? `<button class="btn-sm btn-primary-sm" data-switch="${escHtml(ds.name)}">Wybierz</button>` : ''}
                    ${data.datasets.length > 1 && !isActive
                        ? `<button class="btn-sm btn-danger-sm" data-delete="${escHtml(ds.name)}">✕</button>`
                        : ''}
                </div>
            `;
            container.appendChild(item);
        }

        container.querySelectorAll('[data-switch]').forEach(btn => {
            btn.addEventListener('click', async () => {
                await fetch(`${API_URL}/api/datasets/${btn.dataset.switch}/activate`, { method: 'PUT' });
                await loadDbData();
                await renderDatasetList();
                renderDbStats();
                updateFooter();
            });
        });

        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm(`Usunąć zbiór "${btn.dataset.delete}"?`)) return;
                await fetch(`${API_URL}/api/datasets/${btn.dataset.delete}`, { method: 'DELETE' });
                await renderDatasetList();
            });
        });

        updateFooter();
    } catch (e) {
        container.innerHTML = '<p class="empty-msg">Błąd ładowania zbiorów.</p>';
    }
}

document.getElementById('btn-new-dataset').addEventListener('click', async () => {
    const label = prompt('Nazwa nowego zbioru danych:');
    if (!label || !label.trim()) return;
    const res = await fetch(`${API_URL}/api/datasets`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ label: label.trim() }),
    });
    if (!res.ok) { alert('Błąd tworzenia zbioru.'); return; }
    await renderDatasetList();
});

// ── Edytor ─────────────────────────────────────────────────────

document.getElementById('btn-edit-data').addEventListener('click', () => {
    initMapEditor(currentVizData);
    showView('view-editor');
});

document.getElementById('btn-editor-cancel').addEventListener('click', () => {
    showView('view-menu');
});

document.getElementById('btn-editor-save').addEventListener('click', async () => {
    const data    = getMapData();
    const btnSave = document.getElementById('btn-editor-save');
    btnSave.disabled    = true;
    btnSave.textContent = 'Zapisywanie...';

    try {
        const res = await fetch(`${API_URL}/api/setup`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                border: data.border || [],
                houses: data.houses || [],
                mines:  data.mines  || [],
            }),
        });

        if (!res.ok) {
            const text = await res.text();
            alert(`Błąd zapisywania: ${text}`);
            return;
        }

        await loadDbData();
        showView('view-menu');
        renderDbStats();
        updateFooter();
    } catch (e) {
        alert(`Błąd połączenia: ${e.message}`);
    } finally {
        btnSave.disabled    = false;
        btnSave.textContent = 'Zapisz dane →';
    }
});

// ── Runner ──────────────────────────────────────────────────────

document.getElementById('btn-run').addEventListener('click', () => {
    if (!selectedAlgoId) return;
    const algo = ALGORITHMS.find(a => a.id === selectedAlgoId);
    document.getElementById('runner-algo-name').textContent = algo.name;
    resetRunner();
    showView('view-runner');
});

function resetRunner() {
    document.getElementById('log-output').innerHTML = '<p class="log-placeholder">Naciśnij "▶ Uruchom" aby rozpocząć obliczenia...</p>';
    document.getElementById('log-status').textContent = '';
    document.getElementById('log-actions').classList.add('hidden');
    document.getElementById('viz-section').classList.add('hidden');
    document.getElementById('map-viz-section').classList.add('hidden');
}

document.getElementById('btn-back').addEventListener('click', () => showView('view-menu'));

document.getElementById('btn-execute').addEventListener('click', () => {
    const algoId  = selectedAlgoId;
    const out     = document.getElementById('log-output');
    const btnExec = document.getElementById('btn-execute');

    out.innerHTML = '';
    document.getElementById('log-status').textContent = 'obliczanie...';
    document.getElementById('log-actions').classList.add('hidden');
    document.getElementById('viz-section').classList.add('hidden');
    document.getElementById('map-viz-section').classList.add('hidden');
    btnExec.disabled = true;

    runAlgorithm(algoId,
        function(line) {
            const p = document.createElement('p');
            p.className = (line.includes('══') || line.includes('──')) ? 'log-line log-separator' : 'log-line';
            p.textContent = line;
            out.appendChild(p);
            out.scrollTop = out.scrollHeight;
        },
        function(logs, result) {
            document.getElementById('log-status').textContent = `gotowe · ${logs.length} linii`;
            btnExec.disabled = false;
            document.getElementById('log-actions').classList.remove('hidden');

            if (algoId === 'patrol') {
                renderPatrolViz(currentVizData, result);
            } else if (algoId === 'border-defense') {
                renderBorderDefenseViz(currentVizData, result);
            } else {
                renderBipartiteGraph(currentVizData, result);
                renderMapViz(currentVizData, result);
            }
        }
    );
});

document.getElementById('btn-download-logs').addEventListener('click', () => {
    const algo = ALGORITHMS.find(a => a.id === selectedAlgoId);
    downloadLogs(`${algo?.shortName ?? 'wyniki'}.txt`);
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

function renderBipartiteGraph(dataset, assignments) {
    if (!dataset || !assignments || assignments.length === 0) return;

    const NS  = 'http://www.w3.org/2000/svg';
    const svg = document.getElementById('viz-svg');

    function el(tag, attrs, text) {
        const node = document.createElementNS(NS, tag);
        for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
        if (text !== undefined) node.textContent = text;
        return node;
    }

    const houseMap = {};
    for (const h of dataset.houses) houseMap[h.id] = h;
    const mineMap = {};
    for (const m of dataset.mines) mineMap[m.id] = m;

    // Rozwiń przydziały do poziomu pojedynczych krasnoludków
    const dwarfRows = [];
    const houseNextDwarf = {};

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

    const sortedMines = [...dataset.mines].sort((a, b) =>
        (a.mineral || '').localeCompare(b.mineral || ''));
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

    svg.appendChild(el('text', { x: lx, y: 18, 'text-anchor': 'middle', 'font-size': '9', fill: '#c9a84c', 'font-family': 'Georgia,serif', 'letter-spacing': '1' }, 'KRASNOLUDKI'));
    svg.appendChild(el('text', { x: rx, y: 18, 'text-anchor': 'middle', 'font-size': '9', fill: '#c9a84c', 'font-family': 'Georgia,serif', 'letter-spacing': '1' }, 'KOPALNIE'));

    for (let i = 0; i < dwarfRows.length; i++) {
        const row   = dwarfRows[i];
        const mi    = mineIdx[row.mineId];
        if (mi === undefined) continue;
        const mine  = mineMap[row.mineId];
        const color = MINERAL_COLORS[mine?.mineral] || '#d97706';
        svg.appendChild(el('line', {
            x1: lx + nr, y1: dY(i),
            x2: rx - nr, y2: mY(mi),
            stroke: color, 'stroke-width': '1.5', opacity: '0.5',
        }));
    }

    for (let i = 0; i < dwarfRows.length; i++) {
        const row     = dwarfRows[i];
        const y       = dY(i);
        const mine    = mineMap[row.mineId];
        const mineral = mine?.mineral || '?';
        const color   = MINERAL_COLORS[mineral] || '#d97706';

        svg.appendChild(el('circle', { cx: lx, cy: y, r: nr, fill: '#4a2800', stroke: color, 'stroke-width': '1.5' }));
        svg.appendChild(el('text', { x: lx - nr - 7, y: y - 2, 'text-anchor': 'end', 'font-size': '10', fill: '#e8d5a3', 'font-family': 'Georgia,serif' }, row.dwarfName));
        svg.appendChild(el('circle', { cx: lx - nr - 12, cy: y + 7, r: 3, fill: color }));
        svg.appendChild(el('text',   { x: lx - nr - 17, y: y + 10, 'text-anchor': 'end', 'font-size': '8', fill: color, 'font-family': 'Georgia,serif' },
            `${mineral} · ~${Math.round(row.distance)}px`));
    }

    for (let i = 0; i < sortedMines.length; i++) {
        const m       = sortedMines[i];
        const y       = mY(i);
        const mineral = m.mineral || '?';
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

function renderMapViz(dataset, assignments) {
    const section = document.getElementById('map-viz-section');

    if (!dataset || !dataset.border || dataset.border.length < 3 || !assignments || assignments.length === 0) {
        section.classList.add('hidden');
        return;
    }

    const svg = document.getElementById('map-viz-svg');
    const NS  = 'http://www.w3.org/2000/svg';

    function el(tag, attrs, text) {
        const node = document.createElementNS(NS, tag);
        for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
        if (text !== undefined) node.textContent = text;
        return node;
    }

    svg.innerHTML = `
        <defs>
            <radialGradient id="mvp" cx="50%" cy="50%" r="70%">
                <stop offset="0%"   stop-color="#f5e6c0"/>
                <stop offset="60%"  stop-color="#e8d5a0"/>
                <stop offset="100%" stop-color="#c9b880"/>
            </radialGradient>
            <pattern id="mvg" width="12" height="12" patternUnits="userSpaceOnUse">
                <path d="M0,12 L12,0" stroke="#5a7a3a" stroke-width="0.6" opacity="0.3"/>
            </pattern>
            <radialGradient id="mvv" cx="50%" cy="50%" r="70%">
                <stop offset="60%"  stop-color="transparent"/>
                <stop offset="100%" stop-color="rgba(30,15,0,0.5)"/>
            </radialGradient>
        </defs>
        <rect width="900" height="650" fill="url(#mvp)"/>
    `;

    let borderPath = '';
    for (let i = 0; i < dataset.border.length; i++) {
        borderPath += (i === 0 ? 'M' : 'L') + dataset.border[i].x + ',' + dataset.border[i].y + ' ';
    }
    borderPath += 'Z';
    svg.appendChild(el('path', { d: borderPath, fill: 'url(#mvg)' }));
    svg.appendChild(el('path', { d: borderPath, fill: 'rgba(80,120,50,0.18)' }));
    svg.appendChild(el('path', { d: borderPath, fill: 'none', stroke: '#4a2800', 'stroke-width': '3.5', 'stroke-linejoin': 'round' }));
    svg.appendChild(el('path', { d: borderPath, fill: 'none', stroke: '#8b5e0a', 'stroke-width': '1.5', 'stroke-linejoin': 'round' }));

    const houseMap = {};
    for (const h of dataset.houses) houseMap[h.id] = h;
    const mineMap = {};
    for (const m of dataset.mines) mineMap[m.id] = m;

    const maxCount = Math.max(...assignments.map(a => a.count), 1);

    for (const a of assignments) {
        const h = houseMap[a.houseId];
        const m = mineMap[a.mineId];
        if (!h || !m) continue;

        const color = MINERAL_COLORS[m.mineral] || '#d97706';
        const sw    = 2 + (a.count / maxCount) * 4;
        const midX  = (h.x + m.x) / 2;
        const midY  = (h.y + m.y) / 2;

        svg.appendChild(el('line', { x1: h.x, y1: h.y, x2: m.x, y2: m.y, stroke: color, 'stroke-width': sw, 'stroke-dasharray': '8 4', opacity: '0.65', 'stroke-linecap': 'round' }));
        svg.appendChild(el('circle', { cx: midX, cy: midY, r: '11', fill: 'rgba(20,10,0,0.85)', stroke: color, 'stroke-width': '1.5' }));
        svg.appendChild(el('text',   { x: midX, y: midY + 4, 'text-anchor': 'middle', 'font-size': '11', fill: color, 'font-family': 'serif', 'font-weight': 'bold', 'pointer-events': 'none' }, a.count));
    }

    const assignedHouses = new Set(assignments.map(a => a.houseId));
    for (const h of dataset.houses) {
        if (!h.x && !h.y) continue;
        const ok = assignedHouses.has(h.id);
        const g  = el('g', { transform: `translate(${h.x},${h.y})`, style: ok ? '' : '--roof:#2a0a00;--wall:#4a3000' });
        g.innerHTML = `
            <use href="#sym-house"/>
            <rect x="-28" y="12" width="56" height="13" rx="3" fill="rgba(30,15,0,0.75)"/>
            <text y="22" text-anchor="middle" font-size="9" fill="#fde68a" font-family="serif" font-weight="bold" pointer-events="none">${h.name || `D${h.id}`}</text>
        `;
        svg.appendChild(g);
    }

    const assignedMines = new Set(assignments.map(a => a.mineId));
    for (const m of dataset.mines) {
        if (!m.x && !m.y) continue;
        const color = MINERAL_COLORS[m.mineral] || '#94a3b8';
        const ok    = assignedMines.has(m.id);
        const g     = el('g', { transform: `translate(${m.x},${m.y})`, style: `color:${color}${ok ? '' : ';opacity:0.35'}` });
        g.innerHTML = `
            <use href="#sym-mine"/>
            <rect x="-22" y="12" width="44" height="13" rx="3" fill="rgba(30,15,0,0.75)"/>
            <text y="22" text-anchor="middle" font-size="9" fill="#fde68a" font-family="serif" font-weight="bold" pointer-events="none">${m.mineral || '?'}</text>
        `;
        svg.appendChild(g);
    }

    svg.appendChild(el('rect', { width: 900, height: 650, fill: 'url(#mvv)', 'pointer-events': 'none' }));
    section.classList.remove('hidden');
}

// ═══════════════════════════════════════════════════════════════
// WIZUALIZACJA — PATROL SOLVER (wypukła otoczka)
// ═══════════════════════════════════════════════════════════════

function renderPatrolViz(dataset, hullPoints) {
    // Ukryj grafy przydziałów — nie dotyczą tego algorytmu
    document.getElementById('viz-section').classList.add('hidden');

    const section = document.getElementById('map-viz-section');
    if (!dataset || !hullPoints || hullPoints.length < 3) {
        section.classList.add('hidden');
        return;
    }

    const svg = document.getElementById('map-viz-svg');
    const NS  = 'http://www.w3.org/2000/svg';
    function el(tag, attrs, text) {
        const node = document.createElementNS(NS, tag);
        for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
        if (text !== undefined) node.textContent = text;
        return node;
    }

    // Tło mapy
    svg.innerHTML = `
        <defs>
            <radialGradient id="mvp2" cx="50%" cy="50%" r="70%">
                <stop offset="0%"   stop-color="#f5e6c0"/>
                <stop offset="60%"  stop-color="#e8d5a0"/>
                <stop offset="100%" stop-color="#c9b880"/>
            </radialGradient>
            <pattern id="mvg2" width="12" height="12" patternUnits="userSpaceOnUse">
                <path d="M0,12 L12,0" stroke="#5a7a3a" stroke-width="0.6" opacity="0.3"/>
            </pattern>
            <radialGradient id="mvv2" cx="50%" cy="50%" r="70%">
                <stop offset="60%"  stop-color="transparent"/>
                <stop offset="100%" stop-color="rgba(30,15,0,0.5)"/>
            </radialGradient>
        </defs>
        <rect width="900" height="650" fill="url(#mvp2)"/>
    `;

    // Granica królestwa
    if (dataset.border && dataset.border.length >= 3) {
        let bp = dataset.border.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
        svg.appendChild(el('path', { d: bp, fill: 'url(#mvg2)' }));
        svg.appendChild(el('path', { d: bp, fill: 'rgba(80,120,50,0.18)' }));
        svg.appendChild(el('path', { d: bp, fill: 'none', stroke: '#4a2800', 'stroke-width': '2', 'stroke-linejoin': 'round', opacity: '0.5' }));
    }

    // Wypukła otoczka — trasa patrolowa
    const hullPath = hullPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
    svg.appendChild(el('path', { d: hullPath, fill: 'rgba(245,158,11,0.1)', stroke: '#f59e0b', 'stroke-width': '2.5', 'stroke-dasharray': '10 5', 'stroke-linejoin': 'round' }));

    // Strzałki trasy — numery odcinków
    for (let i = 0; i < hullPoints.length; i++) {
        const a = hullPoints[i], b = hullPoints[(i + 1) % hullPoints.length];
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        svg.appendChild(el('circle', { cx: mx, cy: my, r: '10', fill: 'rgba(20,10,0,0.75)', stroke: '#f59e0b', 'stroke-width': '1' }));
        svg.appendChild(el('text',   { x: mx, y: my + 4, 'text-anchor': 'middle', 'font-size': '9', fill: '#f59e0b', 'font-family': 'serif', 'font-weight': 'bold', 'pointer-events': 'none' }, i + 1));
    }

    // Zbiór wszystkich punktów (domki + kopalnie) — szare dla tych wewnątrz
    const hullSet = new Set(hullPoints.map(p => p.id));

    for (const h of dataset.houses) {
        if (!h.x && !h.y) continue;
        const onHull = hullSet.has(h.id) && hullPoints.some(p => p.type === 'house' && p.id === h.id);
        const g = el('g', { transform: `translate(${h.x},${h.y})` });
        g.innerHTML = `
            <use href="#sym-house" style="--roof:${onHull ? '#7f1d1d' : '#3a0a00'};--wall:${onHull ? '#8b6914' : '#4a3000'}"/>
            <rect x="-28" y="12" width="56" height="13" rx="3" fill="rgba(30,15,0,0.75)"/>
            <text y="22" text-anchor="middle" font-size="9" fill="${onHull ? '#fde68a' : '#8a7050'}" font-family="serif" font-weight="bold" pointer-events="none">${h.name || `D${h.id}`}</text>
        `;
        svg.appendChild(g);
    }

    for (const m of dataset.mines) {
        if (!m.x && !m.y) continue;
        const color   = MINERAL_COLORS[m.mineral] || '#94a3b8';
        const onHull  = hullPoints.some(p => p.type === 'mine' && p.id === m.id);
        const g = el('g', { transform: `translate(${m.x},${m.y})`, style: `color:${color}${onHull ? '' : ';opacity:0.35'}` });
        g.innerHTML = `
            <use href="#sym-mine"/>
            <rect x="-22" y="12" width="44" height="13" rx="3" fill="rgba(30,15,0,0.75)"/>
            <text y="22" text-anchor="middle" font-size="9" fill="${onHull ? '#fde68a' : '#8a7050'}" font-family="serif" font-weight="bold" pointer-events="none">${m.mineral || '?'}</text>
        `;
        svg.appendChild(g);
    }

    // Numery wierzchołków otoczki
    hullPoints.forEach((p, i) => {
        svg.appendChild(el('circle', { cx: p.x, cy: p.y, r: '5', fill: '#f59e0b', stroke: '#fff8e1', 'stroke-width': '1.5' }));
        svg.appendChild(el('text', { x: p.x + 8, y: p.y - 7, 'font-size': '9', fill: '#f59e0b', 'font-family': 'serif', 'font-weight': 'bold', 'pointer-events': 'none' }, `P${i + 1}`));
    });

    svg.appendChild(el('rect', { width: 900, height: 650, fill: 'url(#mvv2)', 'pointer-events': 'none' }));

    // Legenda
    const legY = 620;
    svg.appendChild(el('rect', { x: 20, y: legY - 14, width: 300, height: 22, rx: 4, fill: 'rgba(20,10,0,0.7)' }));
    svg.appendChild(el('line', { x1: 28, y1: legY, x2: 58, y2: legY, stroke: '#f59e0b', 'stroke-width': '2', 'stroke-dasharray': '6 3' }));
    svg.appendChild(el('text', { x: 65, y: legY + 4, 'font-size': '10', fill: '#f59e0b', 'font-family': 'serif' }, 'Trasa patrolowa (wypukła otoczka)'));

    section.classList.remove('hidden');
}

// ═══════════════════════════════════════════════════════════════
// WIZUALIZACJA — BORDER DEFENSE SOLVER (Segment Tree)
// ═══════════════════════════════════════════════════════════════

function renderBorderDefenseViz(dataset, segments) {
    document.getElementById('viz-section').classList.add('hidden');

    const section = document.getElementById('map-viz-section');
    if (!dataset || !segments || segments.length === 0 || !dataset.border || dataset.border.length < 3) {
        section.classList.add('hidden');
        return;
    }

    const svg = document.getElementById('map-viz-svg');
    const NS  = 'http://www.w3.org/2000/svg';
    function el(tag, attrs, text) {
        const node = document.createElementNS(NS, tag);
        for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
        if (text !== undefined) node.textContent = text;
        return node;
    }

    // Paleta segmentów
    const SEGMENT_COLORS = ['#f59e0b', '#67e8f9', '#c2410c', '#94a3b8', '#84cc16', '#a78bfa', '#fb7185'];

    svg.innerHTML = `
        <defs>
            <radialGradient id="mvp3" cx="50%" cy="50%" r="70%">
                <stop offset="0%"   stop-color="#f5e6c0"/>
                <stop offset="60%"  stop-color="#e8d5a0"/>
                <stop offset="100%" stop-color="#c9b880"/>
            </radialGradient>
            <pattern id="mvg3" width="12" height="12" patternUnits="userSpaceOnUse">
                <path d="M0,12 L12,0" stroke="#5a7a3a" stroke-width="0.6" opacity="0.3"/>
            </pattern>
            <radialGradient id="mvv3" cx="50%" cy="50%" r="70%">
                <stop offset="60%"  stop-color="transparent"/>
                <stop offset="100%" stop-color="rgba(30,15,0,0.5)"/>
            </radialGradient>
        </defs>
        <rect width="900" height="650" fill="url(#mvp3)"/>
    `;

    const border = dataset.border;

    // Tło terytorium
    const bp = border.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
    svg.appendChild(el('path', { d: bp, fill: 'url(#mvg3)' }));
    svg.appendChild(el('path', { d: bp, fill: 'rgba(80,120,50,0.18)' }));

    // Kolorowe segmenty granicy
    for (let si = 0; si < segments.length; si++) {
        const seg   = segments[si];
        const color = SEGMENT_COLORS[si % SEGMENT_COLORS.length];

        // Odcinek muru odpowiadający temu segmentowi
        const vStart = seg.commander.borderIdx;
        const segLen = Math.ceil(border.length / segments.length);
        const verts  = [];
        for (let k = 0; k < segLen + 1; k++) {
            verts.push(border[(vStart + k) % border.length]);
        }

        // Gruba kolorowa linia segmentu
        for (let k = 0; k < verts.length - 1; k++) {
            const a = verts[k], b = verts[k + 1];
            svg.appendChild(el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: color, 'stroke-width': '6', 'stroke-linecap': 'round', opacity: '0.7' }));
        }

        // Ikona dowódcy przy środku segmentu
        if (verts.length >= 2) {
            const mid = Math.floor(verts.length / 2);
            const cx  = verts[mid].x, cy = verts[mid].y;

            svg.appendChild(el('circle', { cx, cy, r: '16', fill: 'rgba(20,10,0,0.85)', stroke: color, 'stroke-width': '2' }));
            svg.appendChild(el('text',   { x: cx, y: cy - 3, 'text-anchor': 'middle', 'font-size': '13', fill: color, 'font-family': 'serif', 'pointer-events': 'none' }, '📣'));
            svg.appendChild(el('text',   { x: cx, y: cy + 12, 'text-anchor': 'middle', 'font-size': '7.5', fill: color, 'font-family': 'serif', 'font-weight': 'bold', 'pointer-events': 'none' }, seg.commander.name.slice(0, 6)));

            // Tooltip — boks z informacją
            const bx = Math.min(Math.max(cx - 55, 5), 790);
            const by = Math.max(cy - 60, 5);
            svg.appendChild(el('rect',  { x: bx, y: by, width: 110, height: 38, rx: 4, fill: 'rgba(20,10,0,0.82)', stroke: color, 'stroke-width': '1', 'pointer-events': 'none' }));
            svg.appendChild(el('text',  { x: bx + 55, y: by + 14, 'text-anchor': 'middle', 'font-size': '9', fill: '#fde68a', 'font-family': 'serif', 'font-weight': 'bold', 'pointer-events': 'none' }, `Seg. ${si + 1}: ${seg.commander.name}`));
            svg.appendChild(el('text',  { x: bx + 55, y: by + 28, 'text-anchor': 'middle', 'font-size': '8', fill: color, 'font-family': 'serif', 'pointer-events': 'none' }, `głośność: ${seg.commander.loudness} | ${seg.commander.houseName}`));
        }
    }

    // Kontur granicy na wierzchu
    svg.appendChild(el('path', { d: bp, fill: 'none', stroke: '#4a2800', 'stroke-width': '2.5', 'stroke-linejoin': 'round', opacity: '0.7' }));
    svg.appendChild(el('path', { d: bp, fill: 'none', stroke: '#8b5e0a', 'stroke-width': '1',   'stroke-linejoin': 'round' }));

    // Wierzchołki granicy
    border.forEach((p, i) => {
        svg.appendChild(el('circle', { cx: p.x, cy: p.y, r: '4', fill: '#8b5e0a', stroke: '#4a2800', 'stroke-width': '1' }));
        if (i % 2 === 0) {
            svg.appendChild(el('text', { x: p.x + 6, y: p.y - 5, 'font-size': '8', fill: '#c9a84c', 'font-family': 'serif', 'pointer-events': 'none' }, `W${i + 1}`));
        }
    });

    // Domki i kopalnie
    for (const h of dataset.houses) {
        if (!h.x && !h.y) continue;
        const g = el('g', { transform: `translate(${h.x},${h.y})` });
        g.innerHTML = `
            <use href="#sym-house"/>
            <rect x="-28" y="12" width="56" height="13" rx="3" fill="rgba(30,15,0,0.75)"/>
            <text y="22" text-anchor="middle" font-size="9" fill="#fde68a" font-family="serif" font-weight="bold" pointer-events="none">${h.name || `D${h.id}`}</text>
        `;
        svg.appendChild(g);
    }
    for (const m of dataset.mines) {
        if (!m.x && !m.y) continue;
        const color = MINERAL_COLORS[m.mineral] || '#94a3b8';
        const g = el('g', { transform: `translate(${m.x},${m.y})`, style: `color:${color}` });
        g.innerHTML = `
            <use href="#sym-mine"/>
            <rect x="-22" y="12" width="44" height="13" rx="3" fill="rgba(30,15,0,0.75)"/>
            <text y="22" text-anchor="middle" font-size="9" fill="#fde68a" font-family="serif" font-weight="bold" pointer-events="none">${m.mineral || '?'}</text>
        `;
        svg.appendChild(g);
    }

    svg.appendChild(el('rect', { width: 900, height: 650, fill: 'url(#mvv3)', 'pointer-events': 'none' }));

    // Legenda segmentów
    const legX = 20, legY0 = 540;
    svg.appendChild(el('rect', { x: legX - 5, y: legY0 - 18, width: 200, height: segments.length * 18 + 22, rx: 4, fill: 'rgba(20,10,0,0.78)' }));
    svg.appendChild(el('text', { x: legX + 95, y: legY0 - 4, 'text-anchor': 'middle', 'font-size': '9', fill: '#c9a84c', 'font-family': 'Georgia,serif', 'letter-spacing': '1' }, 'DOWÓDCY SEGMENTÓW'));
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i], color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
        const y = legY0 + 12 + i * 18;
        svg.appendChild(el('rect',  { x: legX, y: y - 8, width: 14, height: 8, rx: 2, fill: color, opacity: '0.8' }));
        svg.appendChild(el('text',  { x: legX + 20, y: y, 'font-size': '9', fill: '#e8d5a3', 'font-family': 'serif' }, `Seg. ${i + 1}: ${seg.commander.name} (🔊${seg.commander.loudness})`));
    }

    section.classList.remove('hidden');
}



function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ═══════════════════════════════════════════════════════════════
// HUFFMAN — pobieranie skompresowanych logów i dekompresja
// ═══════════════════════════════════════════════════════════════

// ── Pobierz logi jako .huff (kompresja po stronie backendu) ────

document.getElementById('btn-download-huff').addEventListener('click', async () => {
    if (!lastLogs || lastLogs.length === 0) {
        alert('Brak logów do skompresowania. Uruchom najpierw algorytm.');
        return;
    }

    const btn = document.getElementById('btn-download-huff');
    btn.disabled    = true;
    btn.textContent = '⏳ Kompresowanie…';

    try {
        const response = await fetch(`${API_URL}/api/logs/compressed`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ logs: lastLogs.join('\n') }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: response.statusText }));
            alert(`Błąd kompresji: ${err.error || response.statusText}`);
            return;
        }

        const origBits  = response.headers.get('X-Huffman-Original-Bits');
        const encBits   = response.headers.get('X-Huffman-Encoded-Bits');
        const savedPct  = response.headers.get('X-Huffman-Saved-Percent');
        const fileBytes = response.headers.get('X-Huffman-File-Bytes');

        const blob = await response.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        const algo = ALGORITHMS.find(al => al.id === selectedAlgoId);
        a.href     = url;
        a.download = `${algo?.shortName ?? 'logi'}.huff`;
        a.click();
        URL.revokeObjectURL(url);

        if (origBits && encBits && savedPct) {
            showHuffToast({
                originalBits: parseInt(origBits),
                encodedBits:  parseInt(encBits),
                savedPercent: parseFloat(savedPct),
                fileBytes:    parseInt(fileBytes),
            });
        }
    } catch (err) {
        alert(`Błąd połączenia z backendem: ${err.message}`);
    } finally {
        btn.disabled    = false;
        btn.textContent = '🗜 Pobierz .huff';
    }
});

// ── Toast ze statystykami ───────────────────────────────────────

function showHuffToast(stats) {
    const existing = document.getElementById('huff-toast');
    if (existing) existing.remove();

    const saved = Math.max(0, stats.savedPercent).toFixed(1);
    const toast = document.createElement('div');
    toast.id = 'huff-toast';
    toast.innerHTML = `
        <div class="huff-toast-inner">
            <span class="huff-toast-title">🗜 Huffman — statystyki kompresji</span>
            <div class="huff-toast-row">
                <span>Oryginał (bity)</span><strong>${stats.originalBits} b</strong>
            </div>
            <div class="huff-toast-row">
                <span>Plik .huff</span><strong>${stats.fileBytes} B</strong>
            </div>
            <div class="huff-toast-row huff-toast-accent">
                <span>Oszczędność bitów</span><strong>${saved}%</strong>
            </div>
            <button class="huff-toast-close" onclick="this.closest('#huff-toast').remove()">✕</button>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => document.getElementById('huff-toast')?.remove(), 7000);
}

// ── Modal dekompresji ───────────────────────────────────────────

document.getElementById('btn-decompress-huff').addEventListener('click', () => {
    document.getElementById('modal-decompress').classList.remove('hidden');
    resetDecompModal();
});

// Zamknięcie przez istniejący handler data-close-modal w app.js (już obsługiwany)
// + klik poza modalem
document.getElementById('modal-decompress').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-decompress'))
        document.getElementById('modal-decompress').classList.add('hidden');
});

function resetDecompModal() {
    document.getElementById('decomp-result').classList.add('hidden');
    document.getElementById('decomp-error').classList.add('hidden');
    document.getElementById('decomp-drop-label').textContent = 'Upuść plik .huff tutaj lub kliknij aby wybrać';
    document.getElementById('decomp-file-input').value = '';
}

// Drag & Drop
const _dz = document.getElementById('decomp-drop-zone');
_dz.addEventListener('dragover',  e => { e.preventDefault(); _dz.classList.add('decomp-drag-over'); });
_dz.addEventListener('dragleave', () => _dz.classList.remove('decomp-drag-over'));
_dz.addEventListener('drop', e => {
    e.preventDefault();
    _dz.classList.remove('decomp-drag-over');
    const f = e.dataTransfer.files[0];
    if (f) handleHuffFile(f);
});
_dz.addEventListener('click', () => document.getElementById('decomp-file-input').click());
document.getElementById('decomp-file-input').addEventListener('change', e => {
    const f = e.target.files[0];
    if (f) handleHuffFile(f);
});

// ── Parser .huff w JS (musi być zgodny bit-po-bicie z HuffmanSolver.cs) ──
//
// Format:
//   [4B] magic "HUFF"
//   [4B] symbolCount (int32 LE)
//   [4B] originalLen (int32 LE)
//   [4B] bitCount    (int32 LE)
//   Dla każdego symbolu:
//     [2B] char UTF-16 LE
//     [4B] codeLen
//     [NB] kod '0'/'1' ASCII
//   [ceil(bitCount/8) B] bity MSB-first

async function handleHuffFile(file) {
    const label  = document.getElementById('decomp-drop-label');
    const errEl  = document.getElementById('decomp-error');
    const resEl  = document.getElementById('decomp-result');

    label.textContent = `⏳ Wczytywanie: ${file.name}…`;
    errEl.classList.add('hidden');
    resEl.classList.add('hidden');

    if (!file.name.endsWith('.huff')) {
        showDecompError('Nieprawidłowy format — oczekiwano pliku .huff');
        label.textContent = 'Upuść plik .huff tutaj lub kliknij aby wybrać';
        return;
    }

    try {
        const ab    = await file.arrayBuffer();
        const dv    = new DataView(ab);
        const bytes = new Uint8Array(ab);

        // Magic
        const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
        if (magic !== 'HUFF') {
            showDecompError('Nieprawidłowy plik — brakuje nagłówka HUFF.');
            return;
        }

        let offset = 4;
        const symbolCount = dv.getInt32(offset, true); offset += 4;
        const originalLen = dv.getInt32(offset, true); offset += 4;
        const bitCount    = dv.getInt32(offset, true); offset += 4;

        // Tabela kodów
        const codeTable = {};
        for (let i = 0; i < symbolCount; i++) {
            const charCode = dv.getInt16(offset, true); offset += 2;
            const symbol   = String.fromCharCode(charCode);
            const codeLen  = dv.getInt32(offset, true); offset += 4;
            let   code     = '';
            for (let j = 0; j < codeLen; j++) code += String.fromCharCode(bytes[offset++]);
            codeTable[code] = symbol;
        }

        // Rozwiń bity
        let bitString = '';
        for (let i = 0; i < bitCount; i++) {
            const b   = bytes[offset + Math.floor(i / 8)];
            const bit = (b >> (7 - (i % 8))) & 1;
            bitString += bit === 1 ? '1' : '0';
        }

        // Dekoduj
        let decoded = '';
        let current = '';
        for (const bit of bitString) {
            current += bit;
            if (Object.prototype.hasOwnProperty.call(codeTable, current)) {
                decoded += codeTable[current];
                current  = '';
            }
        }

        // Statystyki
        const origBits = decoded.length * 8;
        const encBits  = bitCount;
        const savedPct = (100 - (encBits / origBits * 100)).toFixed(1);

        label.textContent = `✔ ${file.name} (${file.size} B)`;
        showDecompResult(decoded, {
            fileSizeBytes: file.size,
            originalChars: decoded.length,
            originalBits:  origBits,
            encodedBits:   encBits,
            savedPercent:  savedPct,
        });

    } catch (err) {
        showDecompError(`Błąd dekompresji: ${err.message}`);
        label.textContent = 'Upuść plik .huff tutaj lub kliknij aby wybrać';
    }
}

function showDecompError(msg) {
    const el = document.getElementById('decomp-error');
    el.textContent = msg;
    el.classList.remove('hidden');
    document.getElementById('decomp-result').classList.add('hidden');
}

function showDecompResult(text, stats) {
    document.getElementById('decomp-result').classList.remove('hidden');
    document.getElementById('decomp-stat-origbits').textContent  = `${stats.originalBits} b (${stats.originalChars} znaków)`;
    document.getElementById('decomp-stat-encbits').textContent   = `${stats.encodedBits} b`;
    document.getElementById('decomp-stat-saved').textContent     = `${Math.max(0, stats.savedPercent)}%`;
    document.getElementById('decomp-stat-filesize').textContent  = `${stats.fileSizeBytes} B`;
    document.getElementById('decomp-text-output').textContent    = text;

    document.getElementById('btn-decomp-copy').onclick = () => {
        navigator.clipboard.writeText(text).then(() => {
            document.getElementById('btn-decomp-copy').textContent = '✔ Skopiowano!';
            setTimeout(() => { document.getElementById('btn-decomp-copy').textContent = '⎘ Kopiuj logi'; }, 2000);
        });
    };

    document.getElementById('btn-decomp-save-txt').onclick = () => {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'logi-odkompresowane.txt';
        a.click();
        URL.revokeObjectURL(url);
    };
}

// ═══════════════════════════════════════════════════════════════
// INICJALIZACJA
// ═══════════════════════════════════════════════════════════════

(async () => {
    await loadDbData();
    renderAlgoList();
    renderDbStats();
    await renderDatasetList();
    updateFooter();
})();