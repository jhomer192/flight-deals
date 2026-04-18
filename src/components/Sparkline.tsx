import type { PricePoint } from '../lib/types';

interface Props {
  prices: PricePoint[];
  width?: number;
  height?: number;
}

export function Sparkline({ prices, width = 400, height = 120 }: Props) {
  if (prices.length < 2) return null;

  const values = prices.map((p) => p.price);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const padding = { top: 20, bottom: 30, left: 50, right: 16 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = values.map((v, i) => {
    const x = padding.left + (i / (values.length - 1)) * chartW;
    const y = padding.top + chartH - ((v - min) / range) * chartH;
    return { x, y, value: v, date: prices[i].date };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Gradient fill under the line
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  // Y-axis ticks
  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round(min + (range * i) / yTicks),
  );

  // X-axis labels (show ~5)
  const xLabelCount = Math.min(5, prices.length);
  const xLabels = Array.from({ length: xLabelCount }, (_, i) => {
    const idx = Math.round((i / (xLabelCount - 1)) * (prices.length - 1));
    return { x: points[idx].x, label: prices[idx].date.slice(5) };
  });

  // Find min point for highlight
  const minIdx = values.indexOf(min);
  const minPoint = points[minIdx];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTickValues.map((v) => {
        const y = padding.top + chartH - ((v - min) / range) * chartH;
        return (
          <g key={v}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#334155"
              strokeWidth="0.5"
            />
            <text x={padding.left - 6} y={y + 3} fill="#64748b" fontSize="9" textAnchor="end">
              ${v}
            </text>
          </g>
        );
      })}

      {/* X labels */}
      {xLabels.map((l, i) => (
        <text key={i} x={l.x} y={height - 6} fill="#64748b" fontSize="9" textAnchor="middle">
          {l.label}
        </text>
      ))}

      {/* Area fill */}
      <path d={areaD} fill="url(#sparkGrad)" />

      {/* Line */}
      <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />

      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2" fill="#3b82f6" opacity="0.6" />
      ))}

      {/* Min price highlight */}
      <circle cx={minPoint.x} cy={minPoint.y} r="4" fill="#22c55e" stroke="#0f172a" strokeWidth="2" />
      <text x={minPoint.x} y={minPoint.y - 8} fill="#22c55e" fontSize="10" fontWeight="bold" textAnchor="middle">
        ${min}
      </text>
    </svg>
  );
}
