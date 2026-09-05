import { useState } from 'react';

/**
 * Graphiques en SVG inline, une seule série par graphique : pas de légende
 * (le titre nomme la donnée), grille discrète, valeur sélectionnée affichée
 * en clair au-dessus du tracé.
 */

const W = 320;
const H = 150;
const PAD = { top: 12, right: 10, bottom: 22, left: 34 };

/** Arrondit un pas à 1, 2 ou 5 × 10ⁿ pour des graduations lisibles. */
function niceStep(rough: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(rough, 1e-6)));
  const normalized = rough / magnitude;
  const snapped = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return snapped * magnitude;
}

function niceTicks(min: number, max: number, count = 3): number[] {
  if (max <= min) return [min];
  const step = niceStep((max - min) / count);
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let value = start; value <= max + step * 0.001; value += step) {
    ticks.push(Math.round(value * 1000) / 1000);
  }
  return ticks.length > 0 ? ticks : [min];
}

export interface Point {
  label: string;
  value: number;
  hint?: string;
}

interface ChartProps {
  points: Point[];
  /** Formate la valeur affichée dans la légende de survol. */
  format: (value: number) => string;
  emptyMessage?: string;
}

/** Courbe d'évolution (progression d'un exercice). */
export function LineChart({ points, format, emptyMessage }: ChartProps) {
  const [selected, setSelected] = useState<number | null>(null);

  if (points.length === 0) {
    return <p className="small muted center">{emptyMessage ?? 'Pas encore de données.'}</p>;
  }

  const values = points.map((p) => p.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const min = rawMin === rawMax ? Math.max(0, rawMin - 5) : rawMin - (rawMax - rawMin) * 0.15;
  const max = rawMin === rawMax ? rawMax + 5 : rawMax + (rawMax - rawMin) * 0.15;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) =>
    PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - ((v - min) / (max - min)) * innerH;

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.value)}`).join(' ');
  const area = `${path} L${x(points.length - 1)},${PAD.top + innerH} L${x(0)},${PAD.top + innerH} Z`;
  const active = selected ?? points.length - 1;

  return (
    <div>
      <div className="row-between small" style={{ marginBottom: 4 }}>
        <span className="strong mono">{format(points[active].value)}</span>
        <span className="tiny muted">{points[active].hint ?? points[active].label}</span>
      </div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Évolution">
        <defs>
          <linearGradient id="line-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {niceTicks(min, max).map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--border-soft)"
              strokeWidth={1}
            />
            <text x={4} y={y(tick) + 3} fontSize={9} fill="var(--muted-2)">
              {Math.round(tick)}
            </text>
          </g>
        ))}

        <path d={area} fill="url(#line-fill)" />
        <path
          d={path}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, i) => (
          <g key={`${point.label}-${i}`}>
            <circle
              cx={x(i)}
              cy={y(point.value)}
              r={i === active ? 4.5 : 2.5}
              fill={i === active ? 'var(--accent)' : 'var(--bg)'}
              stroke="var(--accent)"
              strokeWidth={2}
            />
            <rect
              x={x(i) - innerW / (points.length * 2) - 4}
              y={PAD.top}
              width={innerW / points.length + 8}
              height={innerH}
              fill="transparent"
              onPointerDown={() => setSelected(i)}
              style={{ cursor: 'pointer' }}
            />
          </g>
        ))}

        <text x={PAD.left} y={H - 6} fontSize={9} fill="var(--muted-2)">
          {points[0].label}
        </text>
        {points.length > 1 && (
          <text x={W - PAD.right} y={H - 6} fontSize={9} fill="var(--muted-2)" textAnchor="end">
            {points[points.length - 1].label}
          </text>
        )}
      </svg>
    </div>
  );
}

/** Histogramme (volume par semaine). */
export function BarChart({ points, format, emptyMessage }: ChartProps) {
  const [selected, setSelected] = useState<number | null>(null);

  if (points.length === 0) {
    return <p className="small muted center">{emptyMessage ?? 'Pas encore de données.'}</p>;
  }

  const max = Math.max(...points.map((p) => p.value), 1);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / points.length;
  const barW = Math.max(4, slot - 4); // 2 px de respiration de chaque côté
  const active = selected ?? points.length - 1;
  const baseline = PAD.top + innerH;

  return (
    <div>
      <div className="row-between small" style={{ marginBottom: 4 }}>
        <span className="strong mono">{format(points[active].value)}</span>
        <span className="tiny muted">{points[active].hint ?? points[active].label}</span>
      </div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Volume par semaine">
        {niceTicks(0, max, 2).map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={baseline - (tick / max) * innerH}
              y2={baseline - (tick / max) * innerH}
              stroke="var(--border-soft)"
              strokeWidth={1}
            />
            <text
              x={4}
              y={baseline - (tick / max) * innerH + 3}
              fontSize={9}
              fill="var(--muted-2)"
            >
              {tick >= 1000 ? `${Math.round(tick / 1000)}k` : Math.round(tick)}
            </text>
          </g>
        ))}

        {points.map((point, i) => {
          const height = (point.value / max) * innerH;
          const x = PAD.left + i * slot + (slot - barW) / 2;
          return (
            <g key={`${point.label}-${i}`} onPointerDown={() => setSelected(i)} style={{ cursor: 'pointer' }}>
              <rect
                x={x}
                y={baseline - Math.max(height, point.value > 0 ? 2 : 0)}
                width={barW}
                height={Math.max(height, point.value > 0 ? 2 : 0)}
                rx={Math.min(4, barW / 2)}
                fill={i === active ? 'var(--accent)' : 'var(--surface-3)'}
              />
              <rect
                x={PAD.left + i * slot}
                y={PAD.top}
                width={slot}
                height={innerH}
                fill="transparent"
              />
            </g>
          );
        })}

        <text x={PAD.left} y={H - 6} fontSize={9} fill="var(--muted-2)">
          {points[0].label}
        </text>
        {points.length > 1 && (
          <text x={W - PAD.right} y={H - 6} fontSize={9} fill="var(--muted-2)" textAnchor="end">
            {points[points.length - 1].label}
          </text>
        )}
      </svg>
    </div>
  );
}

/** Barres horizontales, pour une répartition (groupes musculaires). */
export function BarList({
  rows,
  format,
}: {
  rows: { label: string; value: number }[];
  format: (value: number) => string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="list" style={{ gap: 8 }}>
      {rows.map((row) => (
        <div key={row.label}>
          <div className="row-between tiny" style={{ marginBottom: 3 }}>
            <span className="muted">{row.label}</span>
            <span className="mono">{format(row.value)}</span>
          </div>
          <div className="bar-track">
            <span
              style={{
                width: `${(row.value / max) * 100}%`,
                background: 'var(--accent)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
