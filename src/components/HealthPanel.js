import React from 'react';
import Badge from './Badge';

export default function HealthPanel({ product, score }) {
  const { nova_group, serving_size, labels } = product;

  return (
    <div className="health-panel">
      <div className="health-advice-grid">

        <div className="advice-card">
          <div className="advice-icon">🧮</div>
          <div className="advice-title">Processing Level</div>
          <div className="advice-text">
            {nova_group === 1 && 'Minimally processed food — excellent choice.'}
            {nova_group === 2 && 'Processed culinary ingredient — use in moderation.'}
            {nova_group === 3 && 'Processed food — contains added ingredients.'}
            {nova_group === 4 && 'Ultra-processed food — limit consumption as much as possible.'}
            {!nova_group  && 'NOVA processing level not available.'}
          </div>
        </div>

        <div className="advice-card">
          <div className="advice-icon">🍽️</div>
          <div className="advice-title">Recommended Serving</div>
          <div className="advice-text">
            {serving_size
              ? `Typical serving: ${serving_size}`
              : 'Serving size data not available. Check the product packaging.'}
          </div>
        </div>

        <div className="advice-card">
          <div className="advice-icon">💡</div>
          <div className="advice-title">General Advice</div>
          <div className="advice-text">
            {score >= 80 && 'This product has a strong nutritional profile. A great regular choice.'}
            {score >= 65 && score < 80 && 'Decent nutritional value. Fine for moderate consumption as part of a balanced diet.'}
            {score >= 50 && score < 65 && 'Moderate quality. Limit frequency and pair with healthier options.'}
            {score >= 35 && score < 50 && 'Poor nutritional value. Consume only occasionally and in small amounts.'}
            {score  < 35 && 'This product has very low nutritional value. Avoid or strictly limit intake.'}
          </div>
        </div>

        {labels?.length > 0 && (
          <div className="advice-card">
            <div className="advice-icon">🏷️</div>
            <div className="advice-title">Certifications & Labels</div>
            <div className="labels-list">
              {labels.map(l => (
                <Badge key={l} text={l} color="#a78bfa" />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
