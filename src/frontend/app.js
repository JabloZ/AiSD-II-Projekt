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

    const algo    = ALGORITHMS.find(a => a.id === algoId);
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
        function(logs, assignments) {
            document.getElementById('log-status').textContent = `gotowe · ${logs.length} linii`;
            btnExec.disabled = false;
            document.getElementById('log-actions').classList.remove('hidden');
            renderBipartiteGraph(currentVizData, assignments);
            renderMapViz(currentVizData, assignments);
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

(async () => {
    await loadDbData();
    renderAlgoList();
    renderDbStats();
    await renderDatasetList();
    updateFooter();
})();
