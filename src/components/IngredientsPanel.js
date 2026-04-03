import React from 'react';
import { InfoIcon } from './Icons';
import { getAdditiveSafety } from '../api';

export default function IngredientsPanel({ product }) {
  const { ingredients, additives } = product;

  return (
    <div className="ingredients-panel">
      {ingredients ? (
        <>
          <div className="ingredients-text">{ingredients}</div>

          {additives.length > 0 && (
            <div className="additives-section">
              <div className="section-title">Food Additives Detected</div>
              <div className="additives-list">
                {additives.map(code => {
                  const safety = getAdditiveSafety(code);
                  return (
                    <span
                      key={code}
                      className={`additive-badge ${safety}`}
                      title={
                        safety === 'danger'  ? 'Concerning additive' :
                        safety === 'caution' ? 'Use with caution'    : 'Generally safe'
                      }
                    >
                      {code}
                    </span>
                  );
                })}
              </div>
              <div className="additive-legend">
                <span className="al-item"><span className="al-dot safe"    />Safe</span>
                <span className="al-item"><span className="al-dot caution" />Caution</span>
                <span className="al-item"><span className="al-dot danger"  />Concerning</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="no-data">
          <InfoIcon /> Ingredients list not available.
        </div>
      )}
    </div>
  );
}
