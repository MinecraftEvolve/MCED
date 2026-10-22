import { useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { GitBranch, X, Search, Info } from "lucide-react";
import { useAppStore } from "@/store";
import { ModDependency } from "@shared/types/mod.types";

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  installed: boolean;
}

interface Edge {
  source: string;
  target: string;
  type: ModDependency["type"];
}

function buildGraph(mods: any[]): { nodes: Node[]; edges: Edge[] } {
  const installedIds = new Set(mods.map(m => m.modId));
  const nodeMap = new Map<string, Node>();
  const edges: Edge[] = [];

  mods.forEach((mod, i) => {
    const angle = (i / mods.length) * Math.PI * 2;
    const r = Math.min(200, 80 + mods.length * 3);
    nodeMap.set(mod.modId, {
      id: mod.modId,
      label: mod.name ?? mod.modId,
      x: 300 + r * Math.cos(angle),
      y: 220 + r * Math.sin(angle),
      vx: 0, vy: 0,
      installed: true,
    });
    for (const dep of mod.dependencies ?? []) {
      if (dep.type === "required" || dep.type === "optional") {
        edges.push({ source: mod.modId, target: dep.modId, type: dep.type });
        if (!nodeMap.has(dep.modId) && !installedIds.has(dep.modId)) {
          nodeMap.set(dep.modId, {
            id: dep.modId, label: dep.modId,
            x: 300 + Math.random() * 100 - 50,
            y: 220 + Math.random() * 100 - 50,
            vx: 0, vy: 0, installed: false,
          });
        }
      }
    }
  });

  return { nodes: Array.from(nodeMap.values()), edges };
}

function runLayout(nodes: Node[], edges: Edge[], steps = 80): Node[] {
  const ns = nodes.map(n => ({ ...n }));
  const idxMap = new Map(ns.map((n, i) => [n.id, i]));

  for (let step = 0; step < steps; step++) {
    // Repulsion
    for (let i = 0; i < ns.length; i++) {
      for (let j = i + 1; j < ns.length; j++) {
        const dx = ns[j].x - ns[i].x;
        const dy = ns[j].y - ns[i].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = 3000 / (dist * dist);
        ns[i].vx -= (dx / dist) * force;
        ns[i].vy -= (dy / dist) * force;
        ns[j].vx += (dx / dist) * force;
        ns[j].vy += (dy / dist) * force;
      }
    }
    // Attraction along edges
    for (const e of edges) {
      const si = idxMap.get(e.source), ti = idxMap.get(e.target);
      if (si == null || ti == null) continue;
      const dx = ns[ti].x - ns[si].x;
      const dy = ns[ti].y - ns[si].y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const force = (dist - 80) * 0.03;
      ns[si].vx += (dx / dist) * force;
      ns[si].vy += (dy / dist) * force;
      ns[ti].vx -= (dx / dist) * force;
      ns[ti].vy -= (dy / dist) * force;
    }
    // Dampen & apply, clamp to viewport
    for (const n of ns) {
      n.vx *= 0.7; n.vy *= 0.7;
      n.x = Math.max(30, Math.min(570, n.x + n.vx));
      n.y = Math.max(20, Math.min(420, n.y + n.vy));
    }
  }
  return ns;
}

interface Props { onClose: () => void; }

export function DependencyGraph({ onClose }: Props) {
  const { mods } = useAppStore();
  const [filter, setFilter] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { nodes, edges } = useMemo(() => {
    const filtered = filter
      ? mods.filter(m => m.name?.toLowerCase().includes(filter.toLowerCase()) || m.modId.toLowerCase().includes(filter.toLowerCase()))
      : mods;
    const raw = buildGraph(filtered.slice(0, 80)); // cap for perf
    return { nodes: runLayout(raw.nodes, raw.edges), edges: raw.edges };
  }, [mods, filter]);

  const activeId = hovered ?? selected;
  const activeEdges = activeId ? edges.filter(e => e.source === activeId || e.target === activeId) : [];
  const activeNeighbors = new Set(activeEdges.flatMap(e => [e.source, e.target]));

  const selectedMod = selected ? mods.find(m => m.modId === selected) : null;

  const typeColor: Record<string, string> = {
    required: "#f97316",
    optional: "#6366f1",
    incompatible: "#ef4444",
    before: "#22c55e",
    after: "#22c55e",
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-4xl mx-4 bg-card rounded-2xl border border-primary/30 shadow-2xl flex flex-col" style={{ height: "85vh" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-primary/15 shrink-0">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <GitBranch className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">Mod Dependency Graph</span>
          <span className="text-xs text-muted-foreground opacity-60">{mods.length} mods</span>
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background/60 border border-primary/20">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                className="w-36 bg-transparent outline-none text-xs placeholder:text-muted-foreground"
                placeholder="Filter mods…"
                value={filter}
                onChange={e => setFilter(e.target.value)}
              />
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Graph */}
          <div className="flex-1 relative overflow-hidden">
            <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 600 440" className="cursor-grab">
              <defs>
                <marker id="arrow-req" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L8,3 L0,6 Z" fill="#f97316" opacity="0.7" />
                </marker>
                <marker id="arrow-opt" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L8,3 L0,6 Z" fill="#6366f1" opacity="0.7" />
                </marker>
              </defs>

              {edges.map((e, i) => {
                const s = nodes.find(n => n.id === e.source);
                const t = nodes.find(n => n.id === e.target);
                if (!s || !t) return null;
                const active = activeId && (activeEdges.includes(e));
                const faded = activeId && !active;
                return (
                  <line
                    key={i}
                    x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                    stroke={typeColor[e.type] ?? "#888"}
                    strokeWidth={active ? 1.5 : 0.8}
                    strokeOpacity={faded ? 0.08 : active ? 0.9 : 0.25}
                    strokeDasharray={e.type === "optional" ? "4 2" : undefined}
                    markerEnd={e.type === "required" ? "url(#arrow-req)" : e.type === "optional" ? "url(#arrow-opt)" : undefined}
                  />
                );
              })}

              {nodes.map(n => {
                const isActive = activeId === n.id;
                const isNeighbor = activeNeighbors.has(n.id) && !isActive;
                const faded = activeId && !isActive && !isNeighbor;
                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x},${n.y})`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHovered(n.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={e => { e.stopPropagation(); setSelected(selected === n.id ? null : n.id); }}
                    opacity={faded ? 0.2 : 1}
                  >
                    <circle
                      r={isActive ? 10 : isNeighbor ? 7 : 5}
                      fill={n.installed ? "var(--color-primary, #6366f1)" : "#555"}
                      fillOpacity={isActive ? 0.9 : 0.6}
                      stroke={isActive ? "white" : "transparent"}
                      strokeWidth={1.5}
                    />
                    {(isActive || isNeighbor || nodes.length < 20) && (
                      <text
                        dy={-10}
                        textAnchor="middle"
                        fontSize={isActive ? 10 : 8}
                        fill="currentColor"
                        className="text-foreground pointer-events-none"
                        style={{ userSelect: "none" }}
                      >
                        {n.label.length > 18 ? n.label.slice(0, 16) + "…" : n.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 flex flex-col gap-1 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-orange-400 inline-block rounded" />Required</div>
              <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-indigo-400 inline-block rounded border-dashed border" style={{borderStyle:"dashed"}} />Optional</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />Installed</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-neutral-500 inline-block" />Missing</div>
            </div>
          </div>

          {/* Side panel */}
          {selectedMod && (
            <div className="w-56 border-l border-primary/15 p-4 shrink-0 overflow-y-auto">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-semibold truncate">{selectedMod.name}</span>
              </div>
              <div className="space-y-1.5 text-[11px] text-muted-foreground">
                <div><span className="opacity-60">ID: </span>{selectedMod.modId}</div>
                <div><span className="opacity-60">Version: </span>{selectedMod.version}</div>
                {selectedMod.authors?.length ? <div><span className="opacity-60">Author: </span>{selectedMod.authors.join(", ")}</div> : null}
              </div>
              {selectedMod.dependencies?.filter(d => d.type === "required").length ? (
                <div className="mt-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Required</p>
                  {selectedMod.dependencies.filter(d => d.type === "required").map(d => (
                    <div key={d.modId} className="text-[11px] py-0.5 text-foreground">{d.modId}</div>
                  ))}
                </div>
              ) : null}
              {selectedMod.dependencies?.filter(d => d.type === "optional").length ? (
                <div className="mt-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Optional</p>
                  {selectedMod.dependencies.filter(d => d.type === "optional").map(d => (
                    <div key={d.modId} className="text-[11px] py-0.5 text-muted-foreground">{d.modId}</div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
