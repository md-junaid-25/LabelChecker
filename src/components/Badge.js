import React from 'react';

export default function Badge({ text, color, bg }) {
  return (
    <span
      className="badge"
      style={{
        color,
        background: bg || color + '20',
        border: `1px solid ${color}40`,
      }}
    >
      {text}
    </span>
  );
}
