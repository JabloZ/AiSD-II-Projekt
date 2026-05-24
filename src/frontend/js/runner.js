import { getById } from './datasets.js';
import { ALGORITHMS } from './algorithms.js';

const API_URL = 'http://localhost:8001';

let currentLogs        = [];
let lastAssignments    = [];
let lastTotalDistance  = 0;

export function getAssignments()   { return lastAssignments; }
export function getTotalDistance() { return lastTotalDistance; }

// Maps frontend dataset format → backend request body
function buildRequest(algoId, dataset) {
    const houses = dataset.houses.map(h => ({
        Id:                h.id,
        X:                 h.x ?? 0,
        Y:                 h.y ?? 0,
        DwarfCount:        h.dwarfCount ?? 1,
        MineralPreferences: h.mineralPreferences ?? [],
        DwarfNames:        h.dwarfNames ?? [],
    }));

    const mines = dataset.mines.map(m => ({
        Id:          m.id,
        X:           m.x ?? 0,
        Y:           m.y ?? 0,
        MineralType: m.mineral,
        Capacity:    m.capacity ?? 1,
    }));

    // Map frontend algorithm id → backend algorithm name
    const algoMap = { hungarian: 'mcmf', greedy: 'greedy', random: 'random' };

    return { Algorithm: algoMap[algoId] ?? 'mcmf', Houses: houses, Mines: mines };
}

export async function runAlgorithm(algoId, datasetId, onLog, onDone) {
    currentLogs       = [];
    lastAssignments   = [];
    lastTotalDistance = 0;

    const dataset = getById(datasetId);
    if (!dataset) {
        const msg = 'BŁĄD: Nie znaleziono zestawu danych.';
        onLog(msg); onDone([]); return;
    }

    const algo = ALGORITHMS.find(a => a.id === algoId);
    onLog(`[lokalne] Wysyłam żądanie: ${algo?.name} | zestaw: "${dataset.name}"`);

    try {
        const body = buildRequest(algoId, dataset);
        const res  = await fetch(`${API_URL}/api/assign`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(body),
        });

        if (!res.ok) {
            const text = await res.text();
            onLog(`BŁĄD HTTP ${res.status}: ${text}`);
            onDone(currentLogs);
            return;
        }

        const data = await res.json();

        lastAssignments   = data.assignments ?? [];
        lastTotalDistance = data.totalDistance ?? 0;

        for (const line of (data.logs ?? [])) {
            currentLogs.push(line);
            onLog(line);
        }

        onDone(currentLogs, lastAssignments);
    } catch (err) {
        const msg = `BŁĄD połączenia z backendem: ${err.message}`;
        onLog(msg);
        currentLogs.push(msg);
        onDone(currentLogs);
    }
}

export function getLogs() { return currentLogs; }

export function downloadLogs(filename = 'wyniki.txt') {
    const blob = new Blob([currentLogs.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}
