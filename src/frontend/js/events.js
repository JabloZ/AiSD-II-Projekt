import { MINERALS, W, H } from './constants.js';
import { state } from './state.js';
import { generateRandomPolygon, randomPointInPolygon } from './geometry.js';
import { getSvgPoint } from './svg.js';
import { render } from './render.js';

// Sidebar buttons

document.getElementById('btn-randomize').addEventListener('click', () => {
    state.border   = generateRandomPolygon();
    state.selected = null;
    state.houses.forEach(h => {
        const pt = randomPointInPolygon(state.border);
        if (pt) { h.x = pt.x; h.y = pt.y; }
    });
    state.mines.forEach(m => {
        const pt = randomPointInPolygon(state.border);
        if (pt) { m.x = pt.x; m.y = pt.y; }
    });
    render();
});

document.getElementById('btn-add-vertex').addEventListener('click', () => {
    state.addingVertex = !state.addingVertex;
    render();
});

document.getElementById('btn-add-house').addEventListener('click', () => {
    const pt = randomPointInPolygon(state.border);
    if (!pt) return;
    const shuffled = [...MINERALS].sort(() => Math.random() - 0.5);
    state.houses.push({
        id:                 Math.random().toString(36).slice(2),
        x: pt.x, y: pt.y,
        dwarfCount:         Math.ceil(Math.random() * 6),
        mineralPreferences: shuffled.slice(0, 1 + Math.floor(Math.random() * 3)),
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
    });
    render();
});

document.getElementById('btn-delete').addEventListener('click', () => {
    if (state.selected === null) return;
    if (typeof state.selected === 'number') {
        if (state.border.length > 3) state.border = state.border.filter((_, i) => i !== state.selected);
    } else {
        state.houses = state.houses.filter(h => h.id !== state.selected);
        state.mines  = state.mines.filter(m => m.id !== state.selected);
    }
    state.selected = null;
    render();
});

// btn-solve and btn-clear-assignments removed — not present in map editor view

document.getElementById('house-dwarf-dec').addEventListener('click', () => {
    const h = state.houses.find(h => h.id === state.selected);
    if (h) { h.dwarfCount = Math.max(1, h.dwarfCount - 1); render(); }
});
document.getElementById('house-dwarf-inc').addEventListener('click', () => {
    const h = state.houses.find(h => h.id === state.selected);
    if (h) { h.dwarfCount++; render(); }
});

document.getElementById('mine-cap-dec').addEventListener('click', () => {
    const m = state.mines.find(m => m.id === state.selected);
    if (m) { m.capacity = Math.max(1, m.capacity - 1); render(); }
});
document.getElementById('mine-cap-inc').addEventListener('click', () => {
    const m = state.mines.find(m => m.id === state.selected);
    if (m) { m.capacity++; render(); }
});

// Mineral select

const mineralSelect = document.getElementById('mine-mineral-select');
if (mineralSelect) {
    MINERALS.forEach(min => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = min;
        mineralSelect.appendChild(opt);
    });
    mineralSelect.addEventListener('change', e => {
        const m = state.mines.find(m => m.id === state.selected);
        if (m) { m.mineralType = e.target.value; render(); }
    });
}

// SVG canvas mouse events

const svg = document.getElementById('map');
if (!svg) throw new Error('SVG #map not found — events.js must be imported after the DOM includes #view-editor');

svg.addEventListener('click', e => {
    if (state.addingVertex) {
        const pt = getSvgPoint(e);
        let bestIdx = 0, bestDist = Infinity;
        for (let i = 0; i < state.border.length; i++) {
            const a = state.border[i], b = state.border[(i + 1) % state.border.length];
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

svg.addEventListener('mousemove', e => {
    if (!state.dragging) return;
    const pt = getSvgPoint(e);
    const nx = pt.x - state.dragOffset.x;
    const ny = pt.y - state.dragOffset.y;

    if (state.dragging.type === 'border-vertex') {
        state.border[state.dragging.index] = { x: Math.max(0, Math.min(W, nx)), y: Math.max(0, Math.min(H, ny)) };
    } else if (state.dragging.type === 'house') {
        const h = state.houses.find(h => h.id === state.dragging.id);
        if (h) { h.x = nx; h.y = ny; }
    } else if (state.dragging.type === 'mine') {
        const m = state.mines.find(m => m.id === state.dragging.id);
        if (m) { m.x = nx; m.y = ny; }
    }
    render();
});

svg.addEventListener('mouseup',    () => { state.dragging = null; render(); });
svg.addEventListener('mouseleave', () => { state.dragging = null; render(); });
