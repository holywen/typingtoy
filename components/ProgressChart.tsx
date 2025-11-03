'use client';

interface DataPoint {
  date: string;
  avgWPM: number;
  avgAccuracy: number;
  sessionCount: number;
}

interface ProgressChartProps {
  data: DataPoint[];
  type: 'wpm' | 'accuracy';
}

export default function ProgressChart({ data, type }: ProgressChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
        <p className="text-gray-600 dark:text-gray-400">
          No data available yet. Complete some exercises to see your progress!
        </p>
      </div>
    );
  }

  const values = data.map((d) => (type === 'wpm' ? d.avgWPM : d.avgAccuracy));
  const maxValue = Math.max(...values, type === 'wpm' ? 100 : 100);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;

  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 50, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1 || 1)) * chartWidth;
    const value = type === 'wpm' ? d.avgWPM : d.avgAccuracy;
    const y = padding.top + chartHeight - ((value - minValue) / range) * chartHeight;
    return { x, y, value, date: d.date };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const areaData = `${pathData} L ${points[points.length - 1].x} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

  // Y-axis labels
  const yAxisLabels = 5;
  const yLabels = Array.from({ length: yAxisLabels }, (_, i) => {
    const value = minValue + (range * i) / (yAxisLabels - 1);
    return Math.round(value);
  });

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        {type === 'wpm' ? 'WPM Progress' : 'Accuracy Progress'}
      </h3>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-4xl mx-auto"
          style={{ minWidth: '600px' }}
        >
          {/* Grid lines */}
          {yLabels.map((label, i) => {
            const y = height - padding.bottom - (i / (yAxisLabels - 1)) * chartHeight;
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-gray-200 dark:text-gray-700"
                  strokeDasharray="4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-600 dark:fill-gray-400"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path
            d={areaData}
            fill={type === 'wpm' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)'}
          />

          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke={type === 'wpm' ? 'rgb(59, 130, 246)' : 'rgb(34, 197, 94)'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, i) => (
            <g key={i}>
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill={type === 'wpm' ? 'rgb(59, 130, 246)' : 'rgb(34, 197, 94)'}
                className="hover:r-7 cursor-pointer transition-all"
              >
                <title>
                  {point.date}: {point.value}
                </title>
              </circle>
              {/* X-axis labels */}
              <text
                x={point.x}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600 dark:fill-gray-400"
              >
                {new Date(point.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </text>
            </g>
          ))}

          {/* Axes */}
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-400 dark:text-gray-600"
          />
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - padding.bottom}
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-400 dark:text-gray-600"
          />

          {/* Y-axis label */}
          <text
            x={15}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90 15 ${height / 2})`}
            className="text-sm font-semibold fill-gray-700 dark:fill-gray-300"
          >
            {type === 'wpm' ? 'Words Per Minute' : 'Accuracy (%)'}
          </text>

          {/* X-axis label */}
          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            className="text-sm font-semibold fill-gray-700 dark:fill-gray-300"
          >
            Date
          </text>
        </svg>
      </div>

      {/* Stats summary */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {Math.round(values[values.length - 1])}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Latest</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {Math.round(values.reduce((a, b) => a + b, 0) / values.length)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Average</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {Math.round(Math.max(...values))}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Best</div>
        </div>
      </div>
    </div>
  );
}
