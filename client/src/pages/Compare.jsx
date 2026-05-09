import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { api } from '../services/api';
import { formatCurrency, capitalizeCompany } from '../utils/formatters';

const STD_LEVEL_SHADES = {
  L1: '#f8f9fa',
  L2: '#f3f4f6',
  L3: '#e5e7eb',
  L4: '#d1d5db',
  L5: '#9ca3af',
};

const STD_LEVEL_DESC = {
  L1: '0–2 YoE',
  L2: '2–5 YoE',
  L3: '5–10 YoE',
  L4: '10–15 YoE',
  L5: '15+ YoE',
};

export function ComparePage() {
  const [levelMap, setLevelMap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompanies, setSelectedCompanies] = useState(['', '', '', '']);

  useEffect(() => {
    api.getLevelMap().then(data => {
      setLevelMap(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const companyNames = levelMap.map(c => capitalizeCompany(c.company));

  const handleSelect = (index, value) => {
    const next = [...selectedCompanies];
    next[index] = value;
    setSelectedCompanies(next);
  };

  const activeCompanies = selectedCompanies
    .map(name => levelMap.find(c => capitalizeCompany(c.company) === name))
    .filter(Boolean);

  // YoE-axis mapping: 15 years = total axis, each year = PX_PER_YEAR pixels
  const MAX_YOE = 15;
  const PX_PER_YEAR = 40; // 15 years × 40px = 600px total height
  const TOTAL_AXIS_HEIGHT = MAX_YOE * PX_PER_YEAR;
  const MIN_BLOCK_HEIGHT = 36; // minimum so text is readable

  const getBlocksForCompany = (company) => {
    const levels = company.levels; // already sorted by avg_total (low → high)
    
    return levels.map((level, idx) => {
      const yoe = Math.min(level.avg_experience, MAX_YOE);
      const prevYoe = idx > 0 ? Math.min(levels[idx - 1].avg_experience, MAX_YOE) : 0;
      const nextYoe = idx < levels.length - 1 ? Math.min(levels[idx + 1].avg_experience, MAX_YOE) : MAX_YOE;

      // This level spans from midpoint(prev, this) to midpoint(this, next)
      const startYoe = (prevYoe + yoe) / 2;
      const endYoe = (yoe + nextYoe) / 2;
      const span = Math.max(endYoe - startYoe, 0);
      const height = Math.max(MIN_BLOCK_HEIGHT, span * PX_PER_YEAR);

      const primaryStd = level.standardized_levels[0] || 'L1';
      const bgColor = idx % 2 === 0 ? '#f8f9fa' : '#ffffff';

      return { ...level, height, bgColor, primaryStd, startYoe, endYoe };
    });
  };

  if (loading) return <div className="p-section text-center text-muted">Loading level data...</div>;

  // Standard level bands on the same YoE axis
  const STD_BANDS = [
    { level: 'L1', start: 0, end: 2 },
    { level: 'L2', start: 2, end: 5 },
    { level: 'L3', start: 5, end: 10 },
    { level: 'L4', start: 10, end: 15 },
    { level: 'L5', start: 15, end: 16 }, // small sliver at bottom
  ];

  return (
    <div className="max-w-[1400px] mx-auto w-full px-lg py-section flex flex-col gap-xl">
      <div>
        <h1 className="text-display-lg font-display text-ink mb-sm">Compare Levels</h1>
        <p className="text-body-md text-muted">See how internal company levels stack up. Heights represent years of experience bands.</p>
      </div>

      {/* Company Selectors */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex flex-col gap-xs">
            <label className="text-body-sm font-semibold text-ink">Company {i + 1}</label>
            <SearchableSelect
              options={companyNames}
              value={selectedCompanies[i]}
              onChange={(val) => handleSelect(i, val)}
              placeholder="Select..."
            />
          </div>
        ))}
      </div>

      {/* Stacked Level Comparison */}
      {activeCompanies.length > 0 && (
        <div className="flex gap-md items-start overflow-x-auto pb-md">
          {activeCompanies.map(company => {
            const blocks = getBlocksForCompany(company);
            return (
              <div key={company.company} className="flex-1 min-w-[180px] flex flex-col">
                {/* Company Header */}
                <div className="text-center mb-sm">
                  <div className="text-title-md font-semibold text-ink">{capitalizeCompany(company.company)}</div>
                </div>

                {/* Stacked Level Blocks — L1 (entry) at top, L5 (senior) at bottom */}
                <div className="flex flex-col rounded-lg overflow-hidden border border-hairline">
                  {blocks.map((block, idx) => {
                    const isSmall = block.height < 50;
                    return (
                      <div
                        key={block.level}
                        className="flex items-center justify-center gap-1 px-2 text-center transition-all hover:bg-gray-100 cursor-default relative group"
                        style={{
                          minHeight: `${block.height}px`,
                          backgroundColor: block.bgColor,
                          borderTop: idx > 0 ? '1px solid #e5e7eb' : 'none',
                          padding: '4px 8px',
                        }}
                      >
                        <span className="font-bold text-ink" style={{ fontSize: isSmall ? '11px' : '13px' }}>{block.level}</span>
                        <span className="font-semibold text-ink" style={{ fontSize: isSmall ? '11px' : '13px' }}>{formatCurrency(block.avg_total)}</span>
                        {!isSmall && <span className="text-muted" style={{ fontSize: '10px' }}>{block.avg_experience}y</span>}

                        {/* Hover tooltip */}
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-ink text-white text-xs rounded-md px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                          <div className="font-semibold">{block.level} → {block.standardized_levels.join(', ')} · {block.avg_experience} avg YoE</div>
                          <div>Base: {formatCurrency(block.avg_base)} · Bonus: {formatCurrency(block.avg_bonus)} · Stock: {formatCurrency(block.avg_stock)}</div>
                          <div>{block.count} record{block.count > 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Standardized Levels Reference — same YoE axis */}
          <div className="w-[100px] shrink-0 flex flex-col">
            <div className="text-center mb-sm">
              <div className="text-title-md font-semibold text-ink">Std Level</div>
            </div>
            <div className="flex flex-col rounded-lg overflow-hidden border border-hairline">
              {STD_BANDS.map((band, idx) => (
                <div
                  key={band.level}
                  className="flex flex-col items-center justify-center px-xs text-center"
                  style={{
                    height: `${Math.max(MIN_BLOCK_HEIGHT, (band.end - band.start) * PX_PER_YEAR)}px`,
                    backgroundColor: STD_LEVEL_SHADES[band.level],
                    borderTop: idx > 0 ? '1px solid #e5e7eb' : 'none',
                  }}
                >
                  <div className="text-title-sm font-bold text-ink">{band.level}</div>
                  <div className="text-caption text-muted">{STD_LEVEL_DESC[band.level]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}



      {activeCompanies.length === 0 && (
        <Card variant="product-mockup" className="p-xl text-center">
          <p className="text-body-md text-muted">Select at least one company above to see the level comparison.</p>
        </Card>
      )}
    </div>
  );
}
