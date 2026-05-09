import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCompany } from '../hooks/useCompany';
import { SalaryTable } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { api } from '../services/api';
import { formatCurrency, capitalizeCompany } from '../utils/formatters';

const STD_LEVEL_SHADES = {
  L1: '#f8f9fa', L2: '#f3f4f6', L3: '#e5e7eb', L4: '#d1d5db', L5: '#9ca3af',
};

export function CompanyPage() {
  const { id } = useParams();
  const { company, loading, error } = useCompany(id);
  const [levelData, setLevelData] = useState(null);

  useEffect(() => {
    api.getLevelMap().then(data => {
      const match = data?.find(c => c.company === id.toLowerCase());
      setLevelData(match);
    }).catch(() => {});
  }, [id]);

  if (loading) {
    return <div className="p-section text-center text-muted">Loading company...</div>;
  }

  if (error || !company) {
    return <div className="p-section text-center text-muted">Company not found or no data available.</div>;
  }

  const { salaries, analytics } = company;

  return (
    <div className="max-w-[1200px] mx-auto w-full px-lg py-section flex flex-col gap-xl">
      <Link to="/table" className="text-body-sm text-muted hover:text-ink hover:underline w-fit">
        &larr; Back to all salaries
      </Link>
      
      <div className="flex flex-col gap-sm">
        <h1 className="text-display-lg font-display text-ink flex items-center gap-md">
          {capitalizeCompany(id)}
          <Badge variant="orange" className="font-sans">{analytics.total_records} Records</Badge>
        </h1>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <Card variant="product-mockup" className="flex flex-col items-center gap-xs py-lg">
          <div className="text-caption text-muted uppercase tracking-wider font-semibold">Median TC</div>
          <div className="text-display-sm text-ink font-display">{formatCurrency(analytics.median_total_compensation)}</div>
        </Card>
        <Card variant="product-mockup" className="flex flex-col items-center gap-xs py-lg">
          <div className="text-caption text-muted uppercase tracking-wider font-semibold">Total Records</div>
          <div className="text-display-sm text-ink font-display">{analytics.total_records}</div>
        </Card>
        <Card variant="product-mockup" className="flex flex-col items-center gap-xs py-lg">
          <div className="text-caption text-muted uppercase tracking-wider font-semibold">Levels</div>
          <div className="text-display-sm text-ink font-display">{Object.keys(analytics.level_distribution).length}</div>
        </Card>
      </div>

      {/* Per-Level Compensation Breakdown */}
      {levelData && levelData.levels.length > 0 && (
        <Card variant="product-mockup" className="flex flex-col gap-md">
          <div className="border-b border-hairline pb-sm">
            <h2 className="text-title-md font-semibold text-ink">Compensation by Level</h2>
            <p className="text-body-sm text-muted">Average compensation for each internal level, sorted by total comp.</p>
          </div>

          {/* Visual Level Bars */}
          <div className="flex flex-col gap-sm">
            {levelData.levels.map((level, idx) => {
              const maxTotal = levelData.levels[levelData.levels.length - 1].avg_total;
              const barWidth = maxTotal > 0 ? Math.max(10, (level.avg_total / maxTotal) * 100) : 50;
              const primaryStd = level.standardized_levels[0] || 'L1';

              return (
                <div key={level.level} className="flex items-center gap-md">
                  {/* Level Label */}
                  <div className="w-[80px] shrink-0 text-right">
                    <div className="text-title-sm font-semibold text-ink">{level.level}</div>
                    <div className="text-caption text-muted">{level.avg_experience} YoE</div>
                  </div>

                  {/* Bar with background fill */}
                  <div className="flex-1 relative rounded-md overflow-hidden border border-hairline" style={{ minHeight: '48px' }}>
                    {/* Colored fill */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-md transition-all"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: idx % 2 === 0 ? '#f3f4f6' : '#e5e7eb',
                      }}
                    />
                    {/* Content on top */}
                    <div className="relative z-10 flex items-center justify-between px-md py-sm h-full">
                      <div className="flex items-center gap-sm">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/60 text-caption font-bold text-gray-800">
                          {primaryStd}
                        </span>
                        <span className="text-body-sm text-gray-600 hidden sm:inline">
                          {formatCurrency(level.avg_base)} · {formatCurrency(level.avg_bonus)} · {formatCurrency(level.avg_stock)}
                        </span>
                      </div>
                      <span className="text-title-md font-bold text-gray-900">{formatCurrency(level.avg_total)}</span>
                    </div>
                  </div>

                  {/* Record count */}
                  <div className="w-[40px] shrink-0 text-caption text-muted text-right">{level.count}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Level Distribution */}
      <Card variant="product-mockup" className="flex flex-col gap-md">
        <div className="border-b border-hairline pb-sm">
          <h2 className="text-title-md font-semibold text-ink">Level Distribution</h2>
        </div>
        <div className="flex flex-wrap gap-md">
          {Object.entries(analytics.level_distribution).map(([level, count]) => (
            <div key={level} className="flex items-center gap-xs">
              <Badge variant="emerald">{level}</Badge>
              <span className="text-body-sm text-muted">{count} record{count > 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>
      </Card>

      <div>
        <h2 className="text-display-sm font-display text-ink mb-md">All Salaries</h2>
        <SalaryTable data={salaries} loading={false} />
      </div>
    </div>
  );
}
