import React from 'react';
import NutrientBar from './NutrientBar';
import { InfoIcon } from './Icons';

export default function NutritionPanel({ product }) {
  const { nutrients, nutriscore } = product;

  return (
    <div className="nutrition-panel">
      <div className="per100g-label">Per 100g / 100ml</div>

      {Object.keys(nutrients).length === 0 ? (
        <div className="no-data">
          <InfoIcon /> Nutritional data not available for this product.
        </div>
      ) : (
        <div className="nutrient-grid">
          <div className="nutrient-card highlight">
            <div className="nc-value">{nutrients.energy_kcal ?? '—'}</div>
            <div className="nc-label">kcal Energy</div>
          </div>
          <div className="nutrient-card">
            <div className="nc-value">{nutrients.protein?.toFixed(1) ?? '—'}g</div>
            <div className="nc-label">Protein</div>
          </div>
          <div className="nutrient-card">
            <div className="nc-value">{nutrients.carbohydrates?.toFixed(1) ?? '—'}g</div>
            <div className="nc-label">Carbs</div>
          </div>
          <div className="nutrient-card">
            <div className="nc-value">{nutrients.fat?.toFixed(1) ?? '—'}g</div>
            <div className="nc-label">Total Fat</div>
          </div>
        </div>
      )}

      <div className="bars-section">
        <NutrientBar label="Sugar"         value={nutrients.sugars}        unit="g"  max={50}   warnThreshold={11.25} dangerThreshold={22.5} />
        <NutrientBar label="Saturated Fat" value={nutrients.saturated_fat} unit="g"  max={30}   warnThreshold={2.5}   dangerThreshold={5} />
        <NutrientBar label="Sodium"        value={nutrients.sodium}        unit="mg" max={1000}  warnThreshold={300}   dangerThreshold={600} color="#00b8ff" />
        <NutrientBar label="Fiber"         value={nutrients.fiber}         unit="g"  max={15}   color="#00e5a0" />
        <NutrientBar label="Protein"       value={nutrients.protein}       unit="g"  max={30}   color="#a78bfa" />
      </div>

      {nutriscore && (
        <div className="nutriscore-row">
          <span className="nutriscore-label">Nutri-Score</span>
          <div className="nutriscore-scale">
            {['A', 'B', 'C', 'D', 'E'].map(g => (
              <div
                key={g}
                className={`ns-grade ${nutriscore === g ? 'active' : ''}`}
                style={{
                  background: { A: '#00e5a0', B: '#7adf3e', C: '#ffb830', D: '#ff8c35', E: '#ff4757' }[g],
                }}
              >
                {g}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
