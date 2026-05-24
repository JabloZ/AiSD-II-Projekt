const STORAGE_KEY = 'kk_datasets_v3';

function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
}

function save(datasets) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(datasets));
}

export function getAll()      { return load(); }
export function getById(id)   { return load().find(d => d.id === id) || null; }

export function create(data) {
    const datasets = load();
    const dataset  = {
        id:        crypto.randomUUID(),
        name:      data.name || 'Nowy zestaw',
        houses:    data.houses || [],
        mines:     data.mines  || [],
        createdAt: Date.now(),
    };
    datasets.push(dataset);
    save(datasets);
    return dataset;
}

export function update(id, data) {
    const datasets = load();
    const idx = datasets.findIndex(d => d.id === id);
    if (idx === -1) return null;
    datasets[idx] = { ...datasets[idx], ...data, id };
    save(datasets);
    return datasets[idx];
}

export function remove(id) {
    save(load().filter(d => d.id !== id));
}

export function seedDefaults() {
    if (load().length > 0) return;

    // Bez hardkodowanych pozycji — mapEditor losuje je wewnątrz granicy przy pierwszym otwarciu
    create({
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

    create({
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

// Stats helper for display
export function datasetStats(ds) {
    const totalDwarfs = (ds.houses || []).reduce((s, h) => s + (h.dwarfCount || 1), 0);
    const mines       = (ds.mines   || []).length;
    return `${totalDwarfs} krasnoludków · ${mines} kopalni`;
}
