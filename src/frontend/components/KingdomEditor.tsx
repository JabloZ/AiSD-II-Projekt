'use client';

import { useState, useRef, useCallback } from 'react';
import { Point, House, Mine, DragTarget } from '@/lib/types';
import {
  generateRandomPolygon,
  randomPointInPolygon,
} from '@/lib/geometry';

const W = 900;
const H = 650;

const MINERALS = ['Złoto', 'Węgiel', 'Miedź', 'Srebro', 'Żelazo', 'Diament'];

const MINERAL_COLORS: Record<string, string> = {
  Złoto: '#f59e0b',
  Węgiel: '#78716c',
  Miedź: '#c2410c',
  Srebro: '#94a3b8',
  Żelazo: '#64748b',
  Diament: '#67e8f9',
};

function uid() {
  return Math.random().toString(36).slice(2);
}

// ── SVG icons ───────────────────────────────────────────────────────────────

function HouseIcon({ count, selected }: { count: number; selected: boolean }) {
  const wallFill = selected ? '#c2a45a' : '#8b6914';
  const roofFill = selected ? '#7f1d1d' : '#5c1a0a';
  return (
    <g>
      {/* Wall */}
      <rect x="-13" y="-8" width="26" height="16" fill={wallFill} stroke="#4a3000" strokeWidth="1.5" rx="1" />
      {/* Roof */}
      <polygon points="0,-22 -15,-8 15,-8" fill={roofFill} stroke="#3b0a00" strokeWidth="1.5" />
      {/* Door */}
      <rect x="-4" y="-1" width="8" height="9" fill="#2c1a00" rx="1" />
      {/* Window */}
      <rect x="5" y="-5" width="5" height="5" fill="#fde68a" opacity="0.8" rx="0.5" />
      {/* Count label with backdrop */}
      <rect x="-28" y="25" width="56" height="13" rx="3" fill="rgba(30,15,0,0.72)" />
      <text y="35" textAnchor="middle" fontSize="10" fill="#fde68a" fontFamily="serif" fontWeight="bold"
        style={{ userSelect: 'none', pointerEvents: 'none' }}>
        {count} krasnol.
      </text>
      {/* Selection ring */}
      {selected && <circle r="20" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.8" />}
    </g>
  );
}

function MineIcon({ mineral, selected }: { mineral: string; selected: boolean }) {
  const gem = MINERAL_COLORS[mineral] ?? '#94a3b8';
  return (
    <g>
      {/* Shaft entrance arch */}
      <rect x="-13" y="-4" width="26" height="14" fill="#1c1412" stroke="#4a3000" strokeWidth="1.5" rx="2" />
      <path d="M-13,-4 Q0,-18 13,-4" fill="#2c1a00" stroke="#4a3000" strokeWidth="1.5" />
      {/* Pickaxe cross */}
      <line x1="-7" y1="-10" x2="7" y2="10" stroke={gem} strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      <line x1="7" y1="-10" x2="-7" y2="10" stroke={gem} strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      {/* Gem dot */}
      <circle r="3.5" fill={gem} opacity="0.95" />
      {/* Label with backdrop */}
      <rect x="-22" y="25" width="44" height="13" rx="3" fill="rgba(30,15,0,0.72)" />
      <text y="35" textAnchor="middle" fontSize="10" fill="#fde68a" fontFamily="serif" fontWeight="bold"
        style={{ userSelect: 'none', pointerEvents: 'none' }}>
        {mineral}
      </text>
      {selected && <circle r="20" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.8" />}
    </g>
  );
}

// ── Decorative stars for SVG background ─────────────────────────────────────

const STARS = Array.from({ length: 60 }, (_, i) => ({
  x: ((i * 137.508 * 7) % W),
  y: ((i * 137.508 * 3) % H),
  r: i % 5 === 0 ? 1.5 : 0.8,
  op: 0.3 + (i % 4) * 0.15,
}));

// ── Main component ───────────────────────────────────────────────────────────

export default function KingdomEditor() {
  const [border, setBorder] = useState<Point[]>(() => generateRandomPolygon(W, H));
  const [houses, setHouses] = useState<House[]>([]);
  const [mines, setMines] = useState<Mine[]>([]);
  const [selected, setSelected] = useState<string | number | null>(null);
  const [dragging, setDragging] = useState<DragTarget>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [addingVertex, setAddingVertex] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const svgPt = useCallback((e: React.MouseEvent): Point => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (W / rect.width),
      y: (e.clientY - rect.top) * (H / rect.height),
    };
  }, []);

  const startDrag = useCallback(
    (target: DragTarget, e: React.MouseEvent, pos: Point) => {
      e.stopPropagation();
      e.preventDefault();
      setDragging(target);
      const pt = svgPt(e);
      setDragOffset({ x: pt.x - pos.x, y: pt.y - pos.y });
    },
    [svgPt]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      const pt = svgPt(e);
      const nx = pt.x - dragOffset.x;
      const ny = pt.y - dragOffset.y;
      if (dragging.type === 'border-vertex') {
        setBorder((prev) => {
          const next = [...prev];
          next[dragging.index] = { x: Math.max(0, Math.min(W, nx)), y: Math.max(0, Math.min(H, ny)) };
          return next;
        });
      } else if (dragging.type === 'house') {
        setHouses((prev) => prev.map((h) => h.id === dragging.id ? { ...h, x: nx, y: ny } : h));
      } else if (dragging.type === 'mine') {
        setMines((prev) => prev.map((m) => m.id === dragging.id ? { ...m, x: nx, y: ny } : m));
      }
    },
    [dragging, dragOffset, svgPt]
  );

  const onMouseUp = useCallback(() => setDragging(null), []);

  const onSvgClick = useCallback(
    (e: React.MouseEvent) => {
      if (addingVertex) {
        const pt = svgPt(e);
        let bestIdx = 0, bestDist = Infinity;
        for (let i = 0; i < border.length; i++) {
          const a = border[i], b = border[(i + 1) % border.length];
          const d = Math.hypot(pt.x - (a.x + b.x) / 2, pt.y - (a.y + b.y) / 2);
          if (d < bestDist) { bestDist = d; bestIdx = i; }
        }
        setBorder((prev) => { const n = [...prev]; n.splice(bestIdx + 1, 0, pt); return n; });
        return;
      }
      setSelected(null);
    },
    [addingVertex, border, svgPt]
  );

  const randomizeBorder = () => { setBorder(generateRandomPolygon(W, H)); setSelected(null); };

  const addHouse = () => {
    const pt = randomPointInPolygon(border, W, H);
    if (!pt) return;
    setHouses((prev) => [...prev, { id: uid(), x: pt.x, y: pt.y, dwarfCount: Math.ceil(Math.random() * 6) }]);
  };

  const addMine = () => {
    const pt = randomPointInPolygon(border, W, H);
    if (!pt) return;
    setMines((prev) => [...prev, {
      id: uid(), x: pt.x, y: pt.y,
      mineralType: MINERALS[Math.floor(Math.random() * MINERALS.length)],
      capacity: Math.ceil(Math.random() * 5),
    }]);
  };

  const deleteSelected = () => {
    if (selected === null) return;
    if (typeof selected === 'number') {
      if (border.length > 3) setBorder((prev) => prev.filter((_, i) => i !== selected));
    } else {
      setHouses((prev) => prev.filter((h) => h.id !== selected));
      setMines((prev) => prev.filter((m) => m.id !== selected));
    }
    setSelected(null);
  };

  const borderPath = border.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';
  const selHouse = houses.find((h) => h.id === selected);
  const selMine = mines.find((m) => m.id === selected);

  return (
    <div className="flex h-screen" style={{ background: '#110e08' }}>

      {/* ── Sidebar ── */}
      <aside className="w-60 flex flex-col gap-4 p-4 overflow-y-auto"
        style={{ background: 'linear-gradient(180deg, #1e1508 0%, #150f06 100%)', borderRight: '2px solid #5c3d00' }}>

        {/* Title */}
        <div className="text-center py-2" style={{ borderBottom: '1px solid #5c3d00' }}>
          <h1 className="font-bold text-lg leading-tight" style={{ color: '#f0c040', fontFamily: 'Georgia, serif' }}>
            Królestwo<br />
            <span className="text-sm font-normal" style={{ color: '#c9a84c' }}></span>
          </h1>
        </div>

        {/* Border section */}
        <div className="panel-section">
          <p className="section-label">Granica</p>
          <button onClick={randomizeBorder} className="btn-primary w-full">Losuj granicę</button>
          <button
            onClick={() => setAddingVertex((v) => !v)}
            className={`btn-secondary w-full mt-1 ${addingVertex ? 'outline outline-2 outline-amber-400' : ''}`}
          >
            {addingVertex ? 'Kliknij krawędź…' : 'Dodaj wierzchołek'}
          </button>
        </div>

        {/* Elements section */}
        <div className="panel-section">
          <p className="section-label">Elementy</p>
          <button onClick={addHouse} className="btn-primary w-full">Dodaj domek</button>
          <button onClick={addMine} className="btn-primary w-full mt-1">Dodaj kopalnię</button>
          {selected !== null && (
            <button onClick={deleteSelected} className="btn-danger w-full mt-2">Usuń zaznaczony</button>
          )}
        </div>

        {/* Selected house details */}
        {selHouse && (
          <div className="panel-section">
            <p className="section-label">Domek</p>
            <div className="prop-box">
              <p className="text-xs mb-2" style={{ color: '#c9a84c' }}>Krasnoludki:</p>
              <div className="flex items-center gap-2">
                <button className="counter-btn" onClick={() => setHouses(p => p.map(h => h.id === selHouse.id ? { ...h, dwarfCount: Math.max(1, h.dwarfCount - 1) } : h))}>−</button>
                <span className="flex-1 text-center font-bold" style={{ color: '#f0c040' }}>{selHouse.dwarfCount}</span>
                <button className="counter-btn" onClick={() => setHouses(p => p.map(h => h.id === selHouse.id ? { ...h, dwarfCount: h.dwarfCount + 1 } : h))}>+</button>
              </div>
            </div>
          </div>
        )}

        {/* Selected mine details */}
        {selMine && (
          <div className="panel-section">
            <p className="section-label">Kopalnia</p>
            <div className="prop-box">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full" style={{ background: MINERAL_COLORS[selMine.mineralType] }} />
                <span className="text-xs font-bold" style={{ color: '#f0c040' }}>{selMine.mineralType}</span>
              </div>
              <p className="text-xs mb-1" style={{ color: '#c9a84c' }}>Pojemność:</p>
              <div className="flex items-center gap-2 mb-2">
                <button className="counter-btn" onClick={() => setMines(p => p.map(m => m.id === selMine.id ? { ...m, capacity: Math.max(1, m.capacity - 1) } : m))}>−</button>
                <span className="flex-1 text-center font-bold" style={{ color: '#f0c040' }}>{selMine.capacity}</span>
                <button className="counter-btn" onClick={() => setMines(p => p.map(m => m.id === selMine.id ? { ...m, capacity: m.capacity + 1 } : m))}>+</button>
              </div>
              <select
                className="w-full text-xs p-1 rounded"
                style={{ background: '#2c1a00', color: '#e8d5a3', border: '1px solid #5c3d00' }}
                value={selMine.mineralType}
                onChange={(e) => setMines(p => p.map(m => m.id === selMine.id ? { ...m, mineralType: e.target.value } : m))}
              >
                {MINERALS.map((min) => <option key={min}>{min}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-auto text-xs space-y-1" style={{ color: '#c9b07a', borderTop: '1px solid #5c3d00', paddingTop: '8px' }}>
          <p>Wierzchołki granicy: <span className="font-bold" style={{ color: '#f0c040' }}>{border.length}</span></p>
          <p>Domki: <span className="font-bold" style={{ color: '#f0c040' }}>{houses.length}</span></p>
          <p>Kopalnie: <span className="font-bold" style={{ color: '#f0c040' }}>{mines.length}</span></p>
          <p>Krasnoludki: <span className="font-bold" style={{ color: '#f0c040' }}>{houses.reduce((s, h) => s + h.dwarfCount, 0)}</span></p>
        </div>

        <p className="text-xs italic" style={{ color: '#8a7050' }}>
          Przeciągnij elementy myszką. Kliknij, aby zaznaczyć.
        </p>
      </aside>

      {/* ── Map canvas ── */}
      <main className="flex-1 flex items-center justify-center p-6 overflow-auto"
        style={{ background: 'radial-gradient(ellipse at center, #1a1208 0%, #0d0900 100%)' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onClick={onSvgClick}
          style={{
            cursor: addingVertex ? 'crosshair' : dragging ? 'grabbing' : 'default',
            maxWidth: '100%',
            maxHeight: '100%',
            borderRadius: '4px',
            boxShadow: '0 0 40px rgba(200,160,50,0.15), 0 0 0 2px #5c3d00',
          }}
        >
          <defs>
            {/* Parchment gradient */}
            <radialGradient id="parchment" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#f5e6c0" />
              <stop offset="60%" stopColor="#e8d5a0" />
              <stop offset="100%" stopColor="#c9b880" />
            </radialGradient>
            {/* Map grid */}
            <pattern id="mapgrid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#b8a060" strokeWidth="0.4" opacity="0.5" />
            </pattern>
            {/* Fine crosshatch texture */}
            <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M0,8 L8,0" stroke="#a08040" strokeWidth="0.3" opacity="0.25" />
            </pattern>
            {/* Vignette */}
            <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
              <stop offset="60%" stopColor="transparent" />
              <stop offset="100%" stopColor="rgba(30,15,0,0.55)" />
            </radialGradient>
            {/* Drop shadow */}
            <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="2" dy="3" stdDeviation="4" floodColor="#3a2000" floodOpacity="0.6" />
            </filter>
            {/* Glow for selected */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* Kingdom fill pattern */}
            <pattern id="grasshatch" width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M0,12 L12,0" stroke="#5a7a3a" strokeWidth="0.6" opacity="0.3" />
            </pattern>
          </defs>

          {/* Parchment background */}
          <rect width={W} height={H} fill="url(#parchment)" />
          <rect width={W} height={H} fill="url(#hatch)" />
          <rect width={W} height={H} fill="url(#mapgrid)" />

          {/* Map border decoration */}
          <rect x="8" y="8" width={W - 16} height={H - 16}
            fill="none" stroke="#8a6030" strokeWidth="2" rx="2" opacity="0.6" />
          <rect x="12" y="12" width={W - 24} height={H - 24}
            fill="none" stroke="#8a6030" strokeWidth="0.8" rx="1" opacity="0.4" />

          {/* Kingdom territory fill */}
          <path d={borderPath} fill="url(#grasshatch)" />
          <path d={borderPath} fill="rgba(80,120,50,0.18)" />

          {/* Kingdom border — thick dark line like on a map */}
          <path d={borderPath} fill="none"
            stroke="#4a2800" strokeWidth="3.5" strokeLinejoin="round"
            filter="url(#shadow)" />
          <path d={borderPath} fill="none"
            stroke="#8b5e0a" strokeWidth="1.5" strokeLinejoin="round" />

          {/* Edge midpoint handles when adding vertex */}
          {addingVertex && border.map((p, i) => {
            const b = border[(i + 1) % border.length];
            return (
              <circle key={`mid-${i}`}
                cx={(p.x + b.x) / 2} cy={(p.y + b.y) / 2}
                r={5} fill="#d4a017" opacity={0.7}
                style={{ cursor: 'crosshair' }} />
            );
          })}

          {/* Border vertices */}
          {border.map((p, i) => (
            <circle key={`v-${i}`}
              cx={p.x} cy={p.y}
              r={selected === i ? 8 : 5}
              fill={selected === i ? '#f59e0b' : '#8b5e0a'}
              stroke={selected === i ? '#fff8e1' : '#4a2800'}
              strokeWidth="1.5"
              style={{ cursor: 'grab' }}
              filter={selected === i ? 'url(#glow)' : undefined}
              onClick={(e) => { e.stopPropagation(); setSelected(i); }}
              onMouseDown={(e) => { setSelected(i); startDrag({ type: 'border-vertex', index: i }, e, p); }}
            />
          ))}

          {/* Houses */}
          {houses.map((h) => (
            <g key={h.id}
              transform={`translate(${h.x},${h.y})`}
              style={{ cursor: 'grab' }}
              filter="url(#shadow)"
              onClick={(e) => { e.stopPropagation(); setSelected(h.id); }}
              onMouseDown={(e) => { setSelected(h.id); startDrag({ type: 'house', id: h.id }, e, h); }}
            >
              <HouseIcon count={h.dwarfCount} selected={selected === h.id} />
            </g>
          ))}

          {/* Mines */}
          {mines.map((m) => (
            <g key={m.id}
              transform={`translate(${m.x},${m.y})`}
              style={{ cursor: 'grab' }}
              filter="url(#shadow)"
              onClick={(e) => { e.stopPropagation(); setSelected(m.id); }}
              onMouseDown={(e) => { setSelected(m.id); startDrag({ type: 'mine', id: m.id }, e, m); }}
            >
              <MineIcon mineral={m.mineralType} selected={selected === m.id} />
            </g>
          ))}

          {/* Vertex label on selection */}
          {typeof selected === 'number' && (
            <g style={{ pointerEvents: 'none', userSelect: 'none' }}>
              <rect
                x={border[selected].x - 38} y={border[selected].y - 27}
                width="76" height="14" rx="3"
                fill="rgba(30,15,0,0.75)"
              />
              <text x={border[selected].x} y={border[selected].y - 16}
                textAnchor="middle" fontSize="10" fontFamily="Georgia, serif"
                fontWeight="bold" fill="#fde68a">
                wierzchołek {selected + 1}
              </text>
            </g>
          )}

          {/* Vignette overlay */}
          <rect width={W} height={H} fill="url(#vignette)" style={{ pointerEvents: 'none' }} />
        </svg>
      </main>
    </div>
  );
}
