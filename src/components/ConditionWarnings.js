import React from 'react';
import { AlertIcon } from './Icons';

const CONDITION_LABELS = {
  diabetes:     '🩸 Diabetes',
  hypertension: '❤️ High BP',
  obesity:      '⚖️ Obesity',
  cholesterol:  '🫀 Cholesterol',
  kidney:       '🫘 Kidney Issue',
};

export default function ConditionWarnings({ selectedConditions, conditionWarnings }) {
  if (selectedConditions.length === 0) return null;

  return (
    <div className="condition-warnings animate-fadeIn">
      {selectedConditions.map(cond => {
        const w = conditionWarnings[cond];
        if (!w) {
          return (
            <div key={cond} className="cond-warning safe">
              <span className="cond-icon">✅</span>
              <div>
                <div className="cond-title">{CONDITION_LABELS[cond]}</div>
                <div className="cond-msgs">Generally safe for this condition based on available nutrient data.</div>
              </div>
            </div>
          );
        }
        return (
          <div key={cond} className="cond-warning warn">
            <span className="cond-icon"><AlertIcon /></span>
            <div>
              <div className="cond-title">{w.icon} {w.label}</div>
              {w.warnings.map((msg, i) => (
                <div key={i} className="cond-msg">• {msg}</div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
