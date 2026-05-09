import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatCurrency, capitalizeCompany } from '../utils/formatters';

const LEVELS = [
  { value: null, label: 'All Levels' },
  { value: 'L1', label: 'L1', desc: '0-2 YoE' },
  { value: 'L2', label: 'L2', desc: '2-5 YoE' },
  { value: 'L3', label: 'L3', desc: '5-10 YoE' },
  { value: 'L4', label: 'L4', desc: '10-15 YoE' },
  { value: 'L5', label: 'L5', desc: '15+ YoE' },
];

export function TopCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLevel, setActiveLevel] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.getTopCompanies(activeLevel).then(res => {
      setCompanies(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [activeLevel]);

  return (
    <div className="max-w-[1200px] mx-auto w-full px-lg py-section flex flex-col gap-xl">
      <div>
        <h1 className="text-display-lg font-display text-ink mb-sm">Top Paying Companies</h1>
        <p className="text-body-md text-muted">Companies ranked by median total compensation{activeLevel ? ` at ${activeLevel}` : ''}.</p>
      </div>

      {/* Level Filter Tabs */}
      <div className="flex flex-wrap gap-sm">
        {LEVELS.map(level => (
          <button
            key={level.label}
            onClick={() => setActiveLevel(level.value)}
            className={`px-4 py-2 rounded-md text-body-sm font-semibold border transition-all ${
              activeLevel === level.value
                ? 'bg-primary text-on-primary border-primary shadow-sm'
                : 'bg-canvas text-muted border-hairline hover:text-ink hover:border-ink'
            }`}
          >
            <span>{level.label}</span>
            {level.desc && <span className="ml-1.5 text-caption opacity-70">({level.desc})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-xl text-center text-muted">Loading leaderboard...</div>
      ) : companies.length === 0 ? (
        <Card variant="product-mockup" className="p-xl text-center">
          <p className="text-body-md text-muted">No data available{activeLevel ? ` for ${activeLevel}` : ''}. <Link to="/add-salary" className="text-ink underline">Add a salary</Link> to get started.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-md">
          {companies.map((company) => (
            <Link key={company.name} to={`/company/${company.name}`} className="block group">
              <Card variant="product-mockup" className="flex items-center gap-lg p-lg hover:shadow-md transition-shadow">
                {/* Rank */}
                <div className="w-10 h-10 rounded-full bg-surface-soft flex items-center justify-center text-title-md font-display text-ink shrink-0">
                  {company.rank}
                </div>

                {/* Logo + Name */}
                <div className="flex items-center gap-md flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-md bg-primary text-on-primary flex items-center justify-center text-title-sm font-bold shrink-0">
                    {capitalizeCompany(company.name).charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-title-md font-semibold text-ink group-hover:underline truncate">{capitalizeCompany(company.name)}</div>
                    <div className="text-body-sm text-muted">{company.count} record{company.count !== 1 ? 's' : ''}</div>
                  </div>
                </div>

                {/* Compensation Breakdown */}
                <div className="hidden md:flex items-center gap-lg">
                  <div className="text-right">
                    <div className="text-caption text-muted">Base</div>
                    <div className="text-body-sm font-medium text-ink">{formatCurrency(company.avgBase)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-caption text-muted">Bonus</div>
                    <div className="text-body-sm font-medium text-ink">{formatCurrency(company.avgBonus)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-caption text-muted">Stock</div>
                    <div className="text-body-sm font-medium text-ink">{formatCurrency(company.avgStock)}</div>
                  </div>
                </div>

                {/* Median TC */}
                <div className="text-right shrink-0">
                  <div className="text-caption text-muted">Median TC</div>
                  <div className="text-title-lg font-semibold text-ink">{formatCurrency(company.medianTC)}</div>
                </div>

                {activeLevel && (
                  <Badge variant="emerald" className="shrink-0">{activeLevel}</Badge>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
