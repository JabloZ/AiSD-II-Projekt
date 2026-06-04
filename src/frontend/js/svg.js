import { W, H } from './constants.js';

const NS = 'http://www.w3.org/2000/svg';

export function svgEl(tag, attrs = {}) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
}

export function clearLayer(id) {
    const layer = document.getElementById(id);
    while (layer.firstChild) layer.removeChild(layer.firstChild);
}

export function getSvgPoint(event) {
    const svg  = document.getElementById('map');
    const rect = svg.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) * (W / rect.width),
        y: (event.clientY - rect.top)  * (H / rect.height),
    };
}
