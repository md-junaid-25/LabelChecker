import React from 'react';

export default function ScoreRing({ score, grade, label, color }) {
  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="score-ring-wrap">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <circle
          cx="60" cy="60" r="44"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ filter: `drop-shadow(0 0 8px ${color}80)`, transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="60" y="54" textAnchor="middle" fill={color} fontSize="28" fontWeight="800" fontFamily="Syne, sans-serif">{grade}</text>
        <text x="60" y="70" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="DM Sans, sans-serif">{score}/100</text>
      </svg>
      <div className="score-label" style={{ color }}>{label}</div>
    </div>
  );
}
