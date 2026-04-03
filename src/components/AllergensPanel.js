import React from 'react';
import { InfoIcon } from './Icons';
import { ALLERGEN_ICONS } from '../api';

export default function AllergensPanel({ product }) {
  const { allergens, traces } = product;

  return (
    <div className="allergens-panel">
      {allergens.length === 0 && traces.length === 0 ? (
        <div className="no-allergens">
          <div className="check-circle">✓</div>
          <div>No allergen information found in the database for this product.</div>
          <div className="allergen-note">Always verify by checking the physical product label.</div>
        </div>
      ) : (
        <>
          {allergens.length > 0 && (
            <div className="allergen-section">
              <div className="allergen-section-title danger-text">⚠️ Contains Allergens</div>
              <div className="allergen-chips">
                {allergens.map(a => (
                  <div key={a} className="allergen-chip danger">
                    <span>{ALLERGEN_ICONS[a] || '⚠️'}</span>
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {traces.length > 0 && (
            <div className="allergen-section">
              <div className="allergen-section-title warn-text">🔍 May Contain Traces</div>
              <div className="allergen-chips">
                {traces.map(t => (
                  <div key={t} className="allergen-chip warn">
                    <span>{ALLERGEN_ICONS[t] || '🔍'}</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="allergen-disclaimer">
        <InfoIcon />
        Data sourced from product labels. Always read the physical packaging for the most accurate allergen information.
      </div>
    </div>
  );
}
