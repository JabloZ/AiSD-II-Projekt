// ═══════════════════════════════════════════════════════════════
// STAŁE
// ═══════════════════════════════════════════════════════════════

const W  = 900;
const H  = 650;
const NS = 'http://www.w3.org/2000/svg';

const MINERALS = ['Złoto', 'Węgiel', 'Miedź', 'Srebro', 'Żelazo', 'Diament'];
const MINERAL_COLORS = {
    'Złoto': '#f59e0b', 'Węgiel': '#78716c', 'Miedź': '#c2410c',
    'Srebro': '#94a3b8', 'Żelazo': '#64748b', 'Diament': '#67e8f9',
};

const DWARF_NAMES = [
    'Karmina', 'Bolek', 'Tolek', 'Zbyszek', 'Aleksy', 'Brygida', 'Celestyn', 'Dorota',
    'Eryk', 'Felicja', 'Grzegorz', 'Halina', 'Irena', 'Janek', 'Kacper', 'Lena',
    'Marek', 'Natalia', 'Oskar', 'Patrycja', 'Rafał', 'Sylwia', 'Tomek', 'Urszula',
    'Wiesław', 'Zofia', 'Andrzej', 'Basia', 'Czesław', 'Danuta', 'Ferdek', 'Grażyna',
];

function randomDwarfName() {
    return DWARF_NAMES[Math.floor(Math.random() * DWARF_NAMES.length)];
}

function newDwarf() {
    return {
        id:                 Math.random().toString(36).slice(2),
        name:               randomDwarfName(),
        mineralPreferences: [MINERALS[Math.floor(Math.random() * MINERALS.length)]],
    };
}

// ═══════════════════════════════════════════════════════════════
// STAN EDYTORA
// ═══════════════════════════════════════════════════════════════

const state = {
    border:       [],
    houses:       [],
    mines:        [],
    selected:     null,
    dragging:     null,
    dragOffset:   { x: 0, y: 0 },
    addingVertex: false,
    assignments:  [],
};

// ═══════════════════════════════════════════════════════════════
// GEOMETRIA
// ═══════════════════════════════════════════════════════════════

function generateRandomPolygon(numVertices = 10) {
    const cx = W / 2, cy = H / 2;
    const minR = Math.min(W, H) * 0.25;
    const maxR = Math.min(W, H) * 0.42;
    const points = [];
    for (let i = 0; i < numVertices; i++) {
        const angle  = (2 * Math.PI * i) / numVertices - Math.PI / 2;
        const jitter = (Math.random() - 0.5) * ((2 * Math.PI) / numVertices) * 0.6;
        const r      = minR + Math.random() * (maxR - minR);
        points.push({
            x: cx + r * Math.cos(angle + jitter),
            y: cy + r * Math.sin(angle + jitter),
        });
    }
    return points;
}

function isPointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        const intersect = (yi > point.y) !== (yj > point.y)
            && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}

function randomPointInPolygon(polygon, maxTries = 500) {
    const xs   = polygon.map(p => p.x);
    const ys   = polygon.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    for (let i = 0; i < maxTries; i++) {
        const pt = {
            x: minX + Math.random() * (maxX - minX),
            y: minY + Math.random() * (maxY - minY),
        };
        if (isPointInPolygon(pt, polygon)) return pt;
    }
    return null;
}

function borderAroundPoints(points, pad = 90) {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const x0 = Math.max(15,  Math.min(...xs) - pad);
    const x1 = Math.min(885, Math.max(...xs) + pad);
    const y0 = Math.max(15,  Math.min(...ys) - pad);
    const y1 = Math.min(635, Math.max(...ys) + pad);
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const dx = (x1 - x0) / 2,  dy = (y1 - y0) / 2;
    return [
        { x: mx - dx * 0.5, y: y0 - dy * 0.1 },
        { x: mx + dx * 0.4, y: y0              },
        { x: x1 + dx * 0.1, y: my - dy * 0.3  },
        { x: x1,            y: my + dy * 0.5  },
        { x: x1 - dx * 0.2, y: y1 + dy * 0.1 },
        { x: mx - dx * 0.1, y: y1              },
        { x: x0,            y: my + dy * 0.4  },
        { x: x0 - dx * 0.1, y: my - dy * 0.5  },
    ].map(p => ({
        x: Math.max(15, Math.min(885, p.x)),
        y: Math.max(15, Math.min(635, p.y)),
    }));
}

// ═══════════════════════════════════════════════════════════════
// POMOCNIKI SVG
// ═══════════════════════════════════════════════════════════════

function svgEl(tag, attrs) {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
}

function clearLayer(id) {
    const layer = document.getElementById(id);
    while (layer.firstChild) layer.removeChild(layer.firstChild);
}

function getSvgPoint(event) {
    const svg  = document.getElementById('map');
    const rect = svg.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) * (W / rect.width),
        y: (event.clientY - rect.top)  * (H / rect.height),
    };
}

// ═══════════════════════════════════════════════════════════════
// RENDEROWANIE
// ═══════════════════════════════════════════════════════════════

function renderBorder() {
    clearLayer('layer-territory');
    clearLayer('layer-border-lines');
    if (state.border.length < 3) return;

    const d = state.border.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';

    const territory = document.getElementById('layer-territory');
    territory.appendChild(svgEl('path', { d, fill: 'url(#grasshatch)' }));
    territory.appendChild(svgEl('path', { d, fill: 'rgba(80,120,50,0.18)' }));

    const lines = document.getElementById('layer-border-lines');
    lines.appendChild(svgEl('path', { d, fill: 'none', stroke: '#4a2800', 'stroke-width': 3.5, 'stroke-linejoin': 'round', filter: 'url(#shadow)' }));
    lines.appendChild(svgEl('path', { d, fill: 'none', stroke: '#8b5e0a', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }));
}

function renderMidHandles() {
    clearLayer('layer-mid-handles');
    if (!state.addingVertex) return;
    const layer = document.getElementById('layer-mid-handles');
    for (let i = 0; i < state.border.length; i++) {
        const a = state.border[i];
        const b = state.border[(i + 1) % state.border.length];
        layer.appendChild(svgEl('circle', {
            cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2,
            r: 5, fill: '#d4a017', opacity: 0.7, style: 'cursor:crosshair',
        }));
    }
}

function renderVertices() {
    clearLayer('layer-vertices');
    clearLayer('layer-vertex-label');
    const layer = document.getElementById('layer-vertices');

    for (let i = 0; i < state.border.length; i++) {
        const p     = state.border[i];
        const isSel = state.selected === i;
        const c = svgEl('circle', {
            cx: p.x, cy: p.y,
            r:      isSel ? 8 : 5,
            fill:   isSel ? '#f59e0b' : '#8b5e0a',
            stroke: isSel ? '#fff8e1' : '#4a2800',
            'stroke-width': 1.5,
            style: 'cursor:grab',
            filter: isSel ? 'url(#glow)' : '',
        });
        // IIFE żeby i nie było współdzielone w domknięciu
        (function(idx) {
            c.addEventListener('click', e => { e.stopPropagation(); state.selected = idx; render(); });
            c.addEventListener('mousedown', e => {
                e.stopPropagation(); e.preventDefault();
                state.selected = idx;
                const pt = getSvgPoint(e);
                state.dragOffset = { x: pt.x - state.border[idx].x, y: pt.y - state.border[idx].y };
                state.dragging = { type: 'border-vertex', index: idx };
                render();
            });
        })(i);
        layer.appendChild(c);
    }

    // Etykieta zaznaczonego wierzchołka
    if (typeof state.selected === 'number' && state.border[state.selected]) {
        const p = state.border[state.selected];
        const labelLayer = document.getElementById('layer-vertex-label');
        labelLayer.appendChild(svgEl('rect', { x: p.x - 38, y: p.y - 27, width: 76, height: 14, rx: 3, fill: 'rgba(30,15,0,0.75)', 'pointer-events': 'none' }));
        const t = svgEl('text', {
            x: p.x, y: p.y - 16, 'text-anchor': 'middle', 'font-size': 10,
            'font-family': 'Georgia, serif', 'font-weight': 'bold',
            fill: '#fde68a', 'pointer-events': 'none', style: 'user-select:none',
        });
        t.textContent = `wierzchołek ${state.selected + 1}`;
        labelLayer.appendChild(t);
    }
}

function makeHouseIcon(h) {
    const isSel = state.selected === h.id;
    const g = svgEl('g', { transform: `translate(${h.x},${h.y})`, style: 'cursor:grab', filter: 'url(#shadow)' });

    g.appendChild(svgEl('rect',    { x: -13, y: -8,  width: 26, height: 16, fill: isSel ? '#c2a45a' : '#8b6914', stroke: '#4a3000', 'stroke-width': 1.5, rx: 1 }));
    g.appendChild(svgEl('polygon', { points: '0,-22 -15,-8 15,-8', fill: isSel ? '#7f1d1d' : '#5c1a0a', stroke: '#3b0a00', 'stroke-width': 1.5 }));
    g.appendChild(svgEl('rect',    { x: -4,  y: -1,  width: 8,  height: 9,  fill: '#2c1a00', rx: 1 }));
    g.appendChild(svgEl('rect',    { x:  5,  y: -5,  width: 5,  height: 5,  fill: '#fde68a', opacity: 0.8, rx: 0.5 }));
    g.appendChild(svgEl('rect',    { x: -28, y:  25, width: 56, height: 13, rx: 3, fill: 'rgba(30,15,0,0.72)' }));

    const label = svgEl('text', { y: 35, 'text-anchor': 'middle', 'font-size': 10, fill: '#fde68a', 'font-family': 'serif', 'font-weight': 'bold', style: 'user-select:none;pointer-events:none' });
    label.textContent = `${(h.dwarfs || []).length} krasnol.`;
    g.appendChild(label);

    if (isSel) g.appendChild(svgEl('circle', { r: 20, fill: 'none', stroke: '#f59e0b', 'stroke-width': 1.5, 'stroke-dasharray': '3 2', opacity: 0.8 }));

    g.addEventListener('click', e => { e.stopPropagation(); state.selected = h.id; render(); });
    g.addEventListener('mousedown', e => {
        e.stopPropagation(); e.preventDefault();
        state.selected = h.id;
        const pt = getSvgPoint(e);
        state.dragOffset = { x: pt.x - h.x, y: pt.y - h.y };
        state.dragging = { type: 'house', id: h.id };
        render();
    });
    return g;
}

function makeMineIcon(m) {
    const isSel = state.selected === m.id;
    const gem   = MINERAL_COLORS[m.mineralType] || '#94a3b8';
    const g = svgEl('g', { transform: `translate(${m.x},${m.y})`, style: 'cursor:grab', filter: 'url(#shadow)' });

    g.appendChild(svgEl('rect',   { x: -13, y: -4, width: 26, height: 14, fill: '#1c1412', stroke: '#4a3000', 'stroke-width': 1.5, rx: 2 }));
    g.appendChild(svgEl('path',   { d: 'M-13,-4 Q0,-18 13,-4', fill: '#2c1a00', stroke: '#4a3000', 'stroke-width': 1.5 }));
    g.appendChild(svgEl('line',   { x1: -7, y1: -10, x2:  7, y2: 10, stroke: gem, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.9 }));
    g.appendChild(svgEl('line',   { x1:  7, y1: -10, x2: -7, y2: 10, stroke: gem, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.9 }));
    g.appendChild(svgEl('circle', { r: 3.5, fill: gem, opacity: 0.95 }));
    g.appendChild(svgEl('rect',   { x: -22, y: 25, width: 44, height: 13, rx: 3, fill: 'rgba(30,15,0,0.72)' }));

    const label = svgEl('text', { y: 35, 'text-anchor': 'middle', 'font-size': 10, fill: '#fde68a', 'font-family': 'serif', 'font-weight': 'bold', style: 'user-select:none;pointer-events:none' });
    label.textContent = m.mineralType;
    g.appendChild(label);

    if (isSel) g.appendChild(svgEl('circle', { r: 20, fill: 'none', stroke: '#f59e0b', 'stroke-width': 1.5, 'stroke-dasharray': '3 2', opacity: 0.8 }));

    g.addEventListener('click', e => { e.stopPropagation(); state.selected = m.id; render(); });
    g.addEventListener('mousedown', e => {
        e.stopPropagation(); e.preventDefault();
        state.selected = m.id;
        const pt = getSvgPoint(e);
        state.dragOffset = { x: pt.x - m.x, y: pt.y - m.y };
        state.dragging = { type: 'mine', id: m.id };
        render();
    });
    return g;
}

function renderDwarfList(house) {
    const container = document.getElementById('house-dwarf-list');
    container.innerHTML = '';

    for (let i = 0; i < house.dwarfs.length; i++) {
        const dwarf = house.dwarfs[i];
        const card  = document.createElement('div');
        card.className = 'dwarf-card';

        // Wiersz: imię + usuń
        const nameRow = document.createElement('div');
        nameRow.className = 'dwarf-name-row';

        const nameInput = document.createElement('input');
        nameInput.type      = 'text';
        nameInput.className = 'dwarf-name-input';
        nameInput.value     = dwarf.name;
        nameInput.addEventListener('input', () => { dwarf.name = nameInput.value; });

        const delBtn = document.createElement('button');
        delBtn.className   = 'dwarf-del-btn';
        delBtn.textContent = '✕';
        delBtn.addEventListener('click', () => {
            house.dwarfs.splice(i, 1);
            render();
        });

        nameRow.appendChild(nameInput);
        nameRow.appendChild(delBtn);
        card.appendChild(nameRow);

        // Tagi minerałów (preferencje danego krasnoludka)
        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'mineral-tags';
        for (const min of MINERALS) {
            const active = dwarf.mineralPreferences.includes(min);
            const color  = MINERAL_COLORS[min];
            const btn    = document.createElement('button');
            btn.className   = 'mineral-tag';
            btn.textContent = min;
            btn.style.background  = active ? `${color}33` : 'rgba(30,15,0,0.5)';
            btn.style.borderColor = active ? color : '#5c3d00';
            btn.style.color       = active ? color : '#6a5040';
            btn.addEventListener('click', () => {
                if (active) {
                    dwarf.mineralPreferences = dwarf.mineralPreferences.filter(m => m !== min);
                } else {
                    dwarf.mineralPreferences.push(min);
                }
                render();
            });
            tagsDiv.appendChild(btn);
        }
        card.appendChild(tagsDiv);
        container.appendChild(card);
    }
}

function updateSidebar() {
    let totalDwarfs = 0;
    for (const h of state.houses) totalDwarfs += (h.dwarfs || []).length;

    document.getElementById('stat-vertices').textContent = state.border.length;
    document.getElementById('stat-houses').textContent   = state.houses.length;
    document.getElementById('stat-mines').textContent    = state.mines.length;
    document.getElementById('stat-dwarfs').textContent   = totalDwarfs;

    document.getElementById('btn-delete').classList.toggle('hidden', state.selected === null);

    const addBtn = document.getElementById('btn-add-vertex');
    if (addBtn) {
        addBtn.textContent = state.addingVertex ? 'Kliknij krawędź…' : 'Dodaj wierzchołek';
        addBtn.classList.toggle('active', state.addingVertex);
    }

    const selHouse = state.houses.find(h => h.id === state.selected);
    const selMine  = state.mines.find(m => m.id === state.selected);

    if (selHouse) {
        document.getElementById('house-props').classList.remove('hidden');
        renderDwarfList(selHouse);
    } else {
        document.getElementById('house-props').classList.add('hidden');
    }

    if (selMine) {
        document.getElementById('mine-props').classList.remove('hidden');
        const color = MINERAL_COLORS[selMine.mineralType];
        document.getElementById('mine-mineral-dot').style.background = color;
        document.getElementById('mine-mineral-name').textContent      = selMine.mineralType;
        document.getElementById('mine-cap-value').textContent         = selMine.capacity;
        document.getElementById('mine-mineral-select').value          = selMine.mineralType;
    } else {
        document.getElementById('mine-props').classList.add('hidden');
    }

    const mapSvgEl = document.getElementById('map');
    mapSvgEl.classList.toggle('adding-vertex', state.addingVertex);
    mapSvgEl.classList.toggle('dragging',      state.dragging !== null);
}

function render() {
    renderBorder();
    renderMidHandles();
    clearLayer('layer-houses');
    for (const h of state.houses) document.getElementById('layer-houses').appendChild(makeHouseIcon(h));
    clearLayer('layer-mines');
    for (const m of state.mines) document.getElementById('layer-mines').appendChild(makeMineIcon(m));
    renderVertices();
    updateSidebar();
}

// ═══════════════════════════════════════════════════════════════
// OBSŁUGA ZDARZEŃ EDYTORA
// ═══════════════════════════════════════════════════════════════

document.getElementById('btn-randomize').addEventListener('click', () => {
    state.border   = generateRandomPolygon();
    state.selected = null;
    for (const h of state.houses) {
        const pt = randomPointInPolygon(state.border);
        if (pt) { h.x = pt.x; h.y = pt.y; }
    }
    for (const m of state.mines) {
        const pt = randomPointInPolygon(state.border);
        if (pt) { m.x = pt.x; m.y = pt.y; }
    }
    render();
});

document.getElementById('btn-add-vertex').addEventListener('click', () => {
    state.addingVertex = !state.addingVertex;
    render();
});

document.getElementById('btn-add-house').addEventListener('click', () => {
    const pt = randomPointInPolygon(state.border);
    if (!pt) return;
    state.houses.push({
        id:    Math.random().toString(36).slice(2),
        x: pt.x, y: pt.y,
        name:  '',
        dwarfs: [newDwarf()],
    });
    render();
});

document.getElementById('btn-add-mine').addEventListener('click', () => {
    const pt = randomPointInPolygon(state.border);
    if (!pt) return;
    state.mines.push({
        id:          Math.random().toString(36).slice(2),
        x: pt.x, y: pt.y,
        mineralType: MINERALS[Math.floor(Math.random() * MINERALS.length)],
        capacity:    Math.ceil(Math.random() * 5),
        name:        '',
    });
    render();
});

document.getElementById('btn-delete').addEventListener('click', () => {
    if (state.selected === null) return;
    if (typeof state.selected === 'number') {
        if (state.border.length > 3) {
            state.border = state.border.filter((_, i) => i !== state.selected);
        }
    } else {
        state.houses = state.houses.filter(h => h.id !== state.selected);
        state.mines  = state.mines.filter(m => m.id !== state.selected);
    }
    state.selected = null;
    render();
});

document.getElementById('btn-add-dwarf').addEventListener('click', () => {
    const h = state.houses.find(h => h.id === state.selected);
    if (h) { h.dwarfs.push(newDwarf()); render(); }
});

document.getElementById('mine-cap-dec').addEventListener('click', () => {
    const m = state.mines.find(m => m.id === state.selected);
    if (m) { m.capacity = Math.max(1, m.capacity - 1); render(); }
});
document.getElementById('mine-cap-inc').addEventListener('click', () => {
    const m = state.mines.find(m => m.id === state.selected);
    if (m) { m.capacity++; render(); }
});

const mineralSelect = document.getElementById('mine-mineral-select');
for (const min of MINERALS) {
    const opt = document.createElement('option');
    opt.value = opt.textContent = min;
    mineralSelect.appendChild(opt);
}
mineralSelect.addEventListener('change', e => {
    const m = state.mines.find(m => m.id === state.selected);
    if (m) { m.mineralType = e.target.value; render(); }
});

// Kliknięcia i przeciąganie na mapie SVG
const mapSvg = document.getElementById('map');

mapSvg.addEventListener('click', e => {
    if (state.addingVertex) {
        const pt = getSvgPoint(e);
        // Znajdź krawędź najbliższą klikniętemu punktowi i wstaw nowy wierzchołek
        let bestIdx = 0, bestDist = Infinity;
        for (let i = 0; i < state.border.length; i++) {
            const a = state.border[i];
            const b = state.border[(i + 1) % state.border.length];
            const d = Math.hypot(pt.x - (a.x + b.x) / 2, pt.y - (a.y + b.y) / 2);
            if (d < bestDist) { bestDist = d; bestIdx = i; }
        }
        state.border.splice(bestIdx + 1, 0, pt);
        render();
        return;
    }
    state.selected = null;
    render();
});

mapSvg.addEventListener('mousemove', e => {
    if (!state.dragging) return;
    const pt = getSvgPoint(e);
    const nx = pt.x - state.dragOffset.x;
    const ny = pt.y - state.dragOffset.y;

    if (state.dragging.type === 'border-vertex') {
        state.border[state.dragging.index] = {
            x: Math.max(0, Math.min(W, nx)),
            y: Math.max(0, Math.min(H, ny)),
        };
    } else if (state.dragging.type === 'house') {
        const h = state.houses.find(h => h.id === state.dragging.id);
        if (h) { h.x = nx; h.y = ny; }
    } else if (state.dragging.type === 'mine') {
        const m = state.mines.find(m => m.id === state.dragging.id);
        if (m) { m.x = nx; m.y = ny; }
    }
    render();
});

mapSvg.addEventListener('mouseup',    () => { state.dragging = null; render(); });
mapSvg.addEventListener('mouseleave', () => { state.dragging = null; render(); });

// ═══════════════════════════════════════════════════════════════
// API — wywołania z app.js
// ═══════════════════════════════════════════════════════════════

export function initMapEditor(dataset) {
    // Reset stanu
    state.border       = [];
    state.houses       = [];
    state.mines        = [];
    state.selected     = null;
    state.dragging     = null;
    state.dragOffset   = { x: 0, y: 0 };
    state.addingVertex = false;
    state.assignments  = [];

    if (dataset) {
        document.getElementById('editor-dataset-name').value = dataset.name || '';

        state.border = (dataset.border && dataset.border.length >= 3)
            ? dataset.border.map(p => ({ x: p.x, y: p.y }))
            : [];

        state.houses = (dataset.houses || []).map(h => {
            // Migracja starego formatu (dwarfCount + dwarfNames + mineralPreferences) → dwarfs[]
            let dwarfs = (h.dwarfs || []).map(d => ({
                id:                 d.id || Math.random().toString(36).slice(2),
                name:               d.name || randomDwarfName(),
                mineralPreferences: [...(d.mineralPreferences || [])],
            }));
            if (dwarfs.length === 0) {
                const count = h.dwarfCount || 1;
                for (let k = 0; k < count; k++) {
                    dwarfs.push({
                        id:                 Math.random().toString(36).slice(2),
                        name:               (h.dwarfNames && h.dwarfNames[k]) || randomDwarfName(),
                        mineralPreferences: [...(h.mineralPreferences || [])],
                    });
                }
            }
            return { id: h.id, x: h.x || 0, y: h.y || 0, name: h.name || '', dwarfs };
        });

        state.mines = (dataset.mines || []).map(m => ({
            id:          m.id,
            x:           m.x || 0,
            y:           m.y || 0,
            mineralType: m.mineral || m.mineralType || 'Złoto',
            capacity:    m.capacity || 1,
            name:        m.name || '',
        }));
    } else {
        document.getElementById('editor-dataset-name').value = 'Nowy zestaw';
    }

    // Wygeneruj granicę jeśli brak
    if (state.border.length < 3) {
        const all = [...state.houses, ...state.mines];
        state.border = all.length > 0 ? borderAroundPoints(all) : generateRandomPolygon();
    }

    // Losuj pozycje elementów bez współrzędnych
    for (const h of state.houses) {
        if (!h.x && !h.y) {
            const pt = randomPointInPolygon(state.border);
            if (pt) { h.x = pt.x; h.y = pt.y; }
        }
    }
    for (const m of state.mines) {
        if (!m.x && !m.y) {
            const pt = randomPointInPolygon(state.border);
            if (pt) { m.x = pt.x; m.y = pt.y; }
        }
    }

    render();
}

export function getMapData() {
    const name = document.getElementById('editor-dataset-name').value.trim() || 'Nowy zestaw';

    const houses = state.houses.map(h => ({
        id:    h.id,
        name:  h.name || '',
        x:     h.x,
        y:     h.y,
        dwarfs: h.dwarfs.map(d => ({
            id:                 d.id,
            name:               d.name,
            mineralPreferences: [...d.mineralPreferences],
        })),
        // Pola kompatybilności wstecznej
        dwarfCount:         h.dwarfs.length,
        dwarfNames:         h.dwarfs.map(d => d.name),
        mineralPreferences: [...new Set(h.dwarfs.flatMap(d => d.mineralPreferences))],
    }));

    const mines = state.mines.map(m => ({
        id:       m.id,
        name:     m.name || '',
        x:        m.x,
        y:        m.y,
        mineral:  m.mineralType,
        capacity: m.capacity,
    }));

    const border = state.border.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));

    return { name, border, houses, mines };
}
