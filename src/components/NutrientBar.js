import React from 'react';

export default function NutrientBar({ label, value, unit, max, color = '#00e5a0', warnThreshold, dangerThreshold }) {
  if (value == null) return null;
  const pct = Math.min((value / max) * 100, 100);
  const isDanger = dangerThreshold && value >= dangerThreshold;
  const isWarn = warnThreshold && value >= warnThreshold && !isDanger;
  const barColor = isDanger ? '#ff4757' : isWarn ? '#ffb830' : color;

  return (
    <div className="nutrient-row">
      <div className="nutrient-label">
        <span>{label}</span>
        <span className="nutrient-value" style={{ color: barColor }}>
          {typeof value === 'number' ? value.toFixed(1) : value}{unit}
        </span>
      </div>
      <div className="nutrient-bar-track">
        <div
          className="nutrient-bar-fill"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
    </div>
  );
}
