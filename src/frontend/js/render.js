import { MINERALS, MINERAL_COLORS } from './constants.js';
import { state } from './state.js';
import { svgEl, clearLayer, getSvgPoint } from './svg.js';

// ── Border & territory ─────────────────────────────────────────────────────────

function renderBorderAndTerritory() {
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

// ── Edge midpoint handles (when adding vertex) ─────────────────────────────────

function renderMidHandles() {
    clearLayer('layer-mid-handles');
    if (!state.addingVertex) return;
    const layer = document.getElementById('layer-mid-handles');
    state.border.forEach((p, i) => {
        const b = state.border[(i + 1) % state.border.length];
        layer.appendChild(svgEl('circle', {
            cx: (p.x + b.x) / 2, cy: (p.y + b.y) / 2,
            r: 5, fill: '#d4a017', opacity: 0.7, style: 'cursor:crosshair',
        }));
    });
}

// ── Border vertices ────────────────────────────────────────────────────────────

function renderVertices() {
    clearLayer('layer-vertices');
    clearLayer('layer-vertex-label');

    const layer = document.getElementById('layer-vertices');
    state.border.forEach((p, i) => {
        const isSel = state.selected === i;
        const c = svgEl('circle', {
            cx: p.x, cy: p.y,
            r: isSel ? 8 : 5,
            fill:   isSel ? '#f59e0b' : '#8b5e0a',
            stroke: isSel ? '#fff8e1' : '#4a2800',
            'stroke-width': 1.5,
            style: 'cursor:grab',
            filter: isSel ? 'url(#glow)' : '',
        });
        c.addEventListener('click', e => { e.stopPropagation(); state.selected = i; render(); });
        c.addEventListener('mousedown', e => {
            e.stopPropagation(); e.preventDefault();
            state.selected = i;
            const pt = getSvgPoint(e);
            state.dragOffset = { x: pt.x - p.x, y: pt.y - p.y };
            state.dragging = { type: 'border-vertex', index: i };
            render();
        });
        layer.appendChild(c);
    });

    if (typeof state.selected === 'number' && state.border[state.selected]) {
        const p = state.border[state.selected];
        const labelLayer = document.getElementById('layer-vertex-label');
        labelLayer.appendChild(svgEl('rect', {
            x: p.x - 38, y: p.y - 27, width: 76, height: 14, rx: 3,
            fill: 'rgba(30,15,0,0.75)', 'pointer-events': 'none',
        }));
        const t = svgEl('text', {
            x: p.x, y: p.y - 16,
            'text-anchor': 'middle', 'font-size': 10,
            'font-family': 'Georgia, serif', 'font-weight': 'bold',
            fill: '#fde68a', 'pointer-events': 'none', style: 'user-select:none',
        });
        t.textContent = `wierzchołek ${state.selected + 1}`;
        labelLayer.appendChild(t);
    }
}

// ── House icon ─────────────────────────────────────────────────────────────────

function makeHouseSvg(h) {
    const isSel    = state.selected === h.id;
    const wallFill = isSel ? '#c2a45a' : '#8b6914';
    const roofFill = isSel ? '#7f1d1d' : '#5c1a0a';

    const g = svgEl('g', { transform: `translate(${h.x},${h.y})`, style: 'cursor:grab', filter: 'url(#shadow)' });

    g.appendChild(svgEl('rect',    { x: -13, y: -8, width: 26, height: 16, fill: wallFill, stroke: '#4a3000', 'stroke-width': 1.5, rx: 1 }));
    g.appendChild(svgEl('polygon', { points: '0,-22 -15,-8 15,-8',         fill: roofFill, stroke: '#3b0a00', 'stroke-width': 1.5 }));
    g.appendChild(svgEl('rect',    { x: -4,  y: -1, width:  8, height:  9, fill: '#2c1a00', rx: 1 }));
    g.appendChild(svgEl('rect',    { x:  5,  y: -5, width:  5, height:  5, fill: '#fde68a', opacity: 0.8, rx: 0.5 }));

    g.appendChild(svgEl('rect', { x: -28, y: 25, width: 56, height: 13, rx: 3, fill: 'rgba(30,15,0,0.72)' }));
    const label = svgEl('text', { y: 35, 'text-anchor': 'middle', 'font-size': 10, fill: '#fde68a', 'font-family': 'serif', 'font-weight': 'bold', style: 'user-select:none;pointer-events:none' });
    label.textContent = `${h.dwarfCount} krasnol.`;
    g.appendChild(label);

    if (isSel) {
        g.appendChild(svgEl('circle', { r: 20, fill: 'none', stroke: '#f59e0b', 'stroke-width': 1.5, 'stroke-dasharray': '3 2', opacity: 0.8 }));
    }

    g.addEventListener('click',     e => { e.stopPropagation(); state.selected = h.id; render(); });
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

// ── Mine icon ──────────────────────────────────────────────────────────────────

function makeMineSvg(m) {
    const isSel = state.selected === m.id;
    const gem   = MINERAL_COLORS[m.mineralType] ?? '#94a3b8';

    const g = svgEl('g', { transform: `translate(${m.x},${m.y})`, style: 'cursor:grab', filter: 'url(#shadow)' });

    g.appendChild(svgEl('rect', { x: -13, y: -4, width: 26, height: 14, fill: '#1c1412', stroke: '#4a3000', 'stroke-width': 1.5, rx: 2 }));
    g.appendChild(svgEl('path', { d: 'M-13,-4 Q0,-18 13,-4',      fill: '#2c1a00', stroke: '#4a3000', 'stroke-width': 1.5 }));
    g.appendChild(svgEl('line', { x1: -7, y1: -10, x2:  7, y2: 10, stroke: gem, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.9 }));
    g.appendChild(svgEl('line', { x1:  7, y1: -10, x2: -7, y2: 10, stroke: gem, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.9 }));
    g.appendChild(svgEl('circle', { r: 3.5, fill: gem, opacity: 0.95 }));

    g.appendChild(svgEl('rect', { x: -22, y: 25, width: 44, height: 13, rx: 3, fill: 'rgba(30,15,0,0.72)' }));
    const label = svgEl('text', { y: 35, 'text-anchor': 'middle', 'font-size': 10, fill: '#fde68a', 'font-family': 'serif', 'font-weight': 'bold', style: 'user-select:none;pointer-events:none' });
    label.textContent = m.mineralType;
    g.appendChild(label);

    if (isSel) {
        g.appendChild(svgEl('circle', { r: 20, fill: 'none', stroke: '#f59e0b', 'stroke-width': 1.5, 'stroke-dasharray': '3 2', opacity: 0.8 }));
    }

    g.addEventListener('click',     e => { e.stopPropagation(); state.selected = m.id; render(); });
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

// ── Assignment lines ───────────────────────────────────────────────────────────

function renderAssignments() {
    clearLayer('layer-assignments');
    const layer = document.getElementById('layer-assignments');
    state.assignments.forEach(a => {
        const house = state.houses.find(h => h.id === a.houseId);
        const mine  = state.mines.find(m => m.id === a.mineId);
        if (!house || !mine) return;

        const color = MINERAL_COLORS[mine.mineralType] ?? '#ffffff';
        const mx = (house.x + mine.x) / 2;
        const my = (house.y + mine.y) / 2;

        const g = svgEl('g', { 'pointer-events': 'none' });
        g.appendChild(svgEl('line', { x1: house.x, y1: house.y, x2: mine.x, y2: mine.y, stroke: color, 'stroke-width': 2, 'stroke-dasharray': '6 3', opacity: 0.65 }));
        g.appendChild(svgEl('circle', { cx: mx, cy: my, r: 9, fill: 'rgba(20,10,0,0.82)', stroke: color, 'stroke-width': 1 }));
        const t = svgEl('text', { x: mx, y: my + 4, 'text-anchor': 'middle', 'font-size': 9, fill: color, 'font-family': 'serif', 'font-weight': 'bold', style: 'user-select:none' });
        t.textContent = a.count;
        g.appendChild(t);
        layer.appendChild(g);
    });
}

// ── Houses & mines layers ──────────────────────────────────────────────────────

function renderHouses() {
    clearLayer('layer-houses');
    const layer = document.getElementById('layer-houses');
    state.houses.forEach(h => layer.appendChild(makeHouseSvg(h)));
}

function renderMines() {
    clearLayer('layer-mines');
    const layer = document.getElementById('layer-mines');
    state.mines.forEach(m => layer.appendChild(makeMineSvg(m)));
}

// ── Sidebar ────────────────────────────────────────────────────────────────────

function updateSidebar() {
    const totalDwarfs = state.houses.reduce((s, h) => s + h.dwarfCount, 0);

    document.getElementById('stat-vertices').textContent = state.border.length;
    document.getElementById('stat-houses').textContent   = state.houses.length;
    document.getElementById('stat-mines').textContent    = state.mines.length;
    document.getElementById('stat-dwarfs').textContent   = totalDwarfs;

    document.getElementById('btn-delete')?.classList.toggle('hidden', state.selected === null);

    const addBtn = document.getElementById('btn-add-vertex');
    if (addBtn) {
        addBtn.textContent = state.addingVertex ? 'Kliknij krawędź…' : 'Dodaj wierzchołek';
        addBtn.classList.toggle('active', state.addingVertex);
    }

    const solveBtn = document.getElementById('btn-solve');
    if (solveBtn) {
        solveBtn.disabled    = state.solving;
        solveBtn.textContent = state.solving ? 'Obliczanie…' : 'Przydziel pracę';
    }

    const errEl = document.getElementById('solve-error');
    if (errEl) {
        errEl.textContent = state.solveError ?? '';
        errEl.classList.toggle('hidden', !state.solveError);
    }

    if (state.assignments.length > 0) {
        const totalAssigned = state.assignments.reduce((s, a) => s + a.count, 0);
        const totalDist     = state.assignments.reduce((s, a) => s + a.count * a.distance, 0);
        const assignedEl    = document.getElementById('stat-assigned');
        const dwarfs2El     = document.getElementById('stat-total-dwarfs2');
        const distEl        = document.getElementById('stat-total-dist');
        const resultsEl     = document.getElementById('assignment-results');
        if (assignedEl) assignedEl.textContent = totalAssigned;
        if (dwarfs2El)  dwarfs2El.textContent  = totalDwarfs;
        if (distEl)     distEl.textContent     = Math.round(totalDist);
        resultsEl?.classList.remove('hidden');
    } else {
        document.getElementById('assignment-results')?.classList.add('hidden');
    }

    const selHouse = state.houses.find(h => h.id === state.selected);
    const selMine  = state.mines.find(m => m.id === state.selected);

    if (selHouse) {
        document.getElementById('house-props').classList.remove('hidden');
        document.getElementById('house-dwarf-count').textContent = selHouse.dwarfCount;

        const tagsEl = document.getElementById('house-mineral-prefs');
        tagsEl.innerHTML = '';
        MINERALS.forEach(min => {
            const active = selHouse.mineralPreferences.includes(min);
            const color  = MINERAL_COLORS[min];
            const btn    = document.createElement('button');
            btn.className   = 'mineral-tag';
            btn.textContent = min;
            btn.style.background  = active ? `${color}33` : 'rgba(30,15,0,0.5)';
            btn.style.borderColor = active ? color : '#5c3d00';
            btn.style.color       = active ? color : '#6a5040';
            btn.addEventListener('click', () => {
                const house = state.houses.find(h => h.id === selHouse.id);
                if (!house) return;
                if (active) house.mineralPreferences = house.mineralPreferences.filter(m => m !== min);
                else        house.mineralPreferences = [...house.mineralPreferences, min];
                render();
            });
            tagsEl.appendChild(btn);
        });
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

    const svg = document.getElementById('map');
    svg.classList.toggle('adding-vertex', state.addingVertex);
    svg.classList.toggle('dragging',      state.dragging !== null);
}

// ── Master render ──────────────────────────────────────────────────────────────

export function render() {
    renderBorderAndTerritory();
    renderMidHandles();
    renderHouses();
    renderMines();
    renderAssignments();
    renderVertices();
    updateSidebar();
}
