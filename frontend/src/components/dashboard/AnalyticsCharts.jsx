import { useState } from 'react';
import { BarChart3, TrendingUp, Star, Calendar, Info } from 'lucide-react';

export default function AnalyticsCharts({ charts, selectedDays, onDaysChange, isLoading }) {
  const { timeline = [], rating_distribution = {} } = charts || {};

  // Check if there is any response activity
  const totalSubmissionsInPeriod = timeline.reduce((acc, curr) => acc + (curr.count || 0), 0);
  const totalRatings = Object.values(rating_distribution).reduce((acc, curr) => acc + curr, 0);

  // SVG dimensions for responsive timeline chart
  const svgWidth = 580;
  const svgHeight = 180;
  const padding = { top: 20, right: 20, bottom: 30, left: 35 };

  const maxCount = Math.max(...timeline.map((d) => d.count || 0), 4);

  // Generate SVG path points
  const points = timeline.map((item, index) => {
    const x = padding.left + (index / Math.max(timeline.length - 1, 1)) * (svgWidth - padding.left - padding.right);
    const y = svgHeight - padding.bottom - ((item.count || 0) / maxCount) * (svgHeight - padding.top - padding.bottom);
    return { x, y, count: item.count || 0, label: item.label, date: item.date };
  });

  const pathD = points.length > 0
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${svgHeight - padding.bottom} L ${points[0].x} ${svgHeight - padding.bottom} Z`
    : '';

  return (
    <div className="analytics-charts-grid">
      {/* Chart 1: Responses Over Time */}
      <div className="card chart-card">
        <div className="chart-header">
          <div>
            <h3 className="chart-title">Responses Over Time</h3>
            <p className="chart-subtitle">Daily customer feedback submissions</p>
          </div>

          {/* Period Selector */}
          <div className="chart-period-tabs">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                className={`period-tab ${selectedDays === d ? 'active' : ''}`}
                onClick={() => onDaysChange && onDaysChange(d)}
                disabled={isLoading}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        <div className="chart-body">
          {isLoading ? (
            <div className="chart-skeleton">
              <div className="spinner spinner-primary" />
            </div>
          ) : totalSubmissionsInPeriod === 0 ? (
            <div className="chart-empty-state">
              <div className="empty-icon-circle">
                <TrendingUp size={24} color="var(--text-dim)" />
              </div>
              <p>No feedback submissions in the last {selectedDays} days.</p>
              <small>Share your published forms to begin collecting responses.</small>
            </div>
          ) : (
            <div className="svg-chart-container">
              <svg 
                viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                className="timeline-svg"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Lines */}
                {[0, 0.5, 1].map((pct, idx) => {
                  const y = padding.top + pct * (svgHeight - padding.top - padding.bottom);
                  const labelVal = Math.round(maxCount * (1 - pct));
                  return (
                    <g key={idx}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={svgWidth - padding.right}
                        y2={y}
                        stroke="var(--border-light)"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 4}
                        textAnchor="end"
                        fontSize="10"
                        fill="var(--text-dim)"
                      >
                        {labelVal}
                      </text>
                    </g>
                  );
                })}

                {/* Shaded Area */}
                <path d={areaD} fill="url(#areaGlow)" />

                {/* Line Path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points */}
                {points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={p.count > 0 ? 4 : 2}
                    fill={p.count > 0 ? 'var(--primary)' : 'var(--border-light)'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  >
                    <title>{`${p.date}: ${p.count} responses`}</title>
                  </circle>
                ))}
              </svg>

              {/* X-Axis Labels */}
              <div className="chart-x-labels">
                <span>{timeline[0]?.label || ''}</span>
                <span>{timeline[Math.floor(timeline.length / 2)]?.label || ''}</span>
                <span>{timeline[timeline.length - 1]?.label || ''}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart 2: Customer Satisfaction (1-5 Star Distribution) */}
      <div className="card chart-card">
        <div className="chart-header">
          <div>
            <h3 className="chart-title">Customer Satisfaction</h3>
            <p className="chart-subtitle">Rating distribution breakdown</p>
          </div>
          <div className="badge badge-primary">
            <Star size={12} fill="#f59e0b" color="#f59e0b" />
            <span>1-5 Stars</span>
          </div>
        </div>

        <div className="chart-body">
          {isLoading ? (
            <div className="chart-skeleton">
              <div className="spinner spinner-primary" />
            </div>
          ) : totalRatings === 0 ? (
            <div className="chart-empty-state">
              <div className="empty-icon-circle">
                <Star size={24} color="var(--text-dim)" />
              </div>
              <p>No customer satisfaction ratings yet.</p>
              <small>Rating questions in your forms will populate this chart.</small>
            </div>
          ) : (
            <div className="rating-distribution-list">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = rating_distribution[star] || 0;
                const percentage = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;

                return (
                  <div key={star} className="rating-dist-row">
                    <div className="rating-star-label">
                      <span>{star}</span>
                      <Star size={13} fill="#f59e0b" color="#f59e0b" />
                    </div>

                    <div className="rating-bar-track">
                      <div
                        className="rating-bar-fill"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor:
                            star >= 4 ? '#10b981' : star === 3 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>

                    <div className="rating-meta-stats">
                      <span className="rating-count">{count}</span>
                      <span className="rating-percent">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}

              <div className="rating-summary-footer">
                <small>Total ratings recorded: <strong>{totalRatings}</strong></small>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
