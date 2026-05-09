import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { formatCurrency } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

export function Analytics() {
  const [data, setData] = useState(null);
  const [stdLevels, setStdLevels] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getAnalytics(),
      api.getStandardizedLevels()
    ]).then(([analyticsRes, levelsRes]) => {
      setData(analyticsRes.data);
      setStdLevels(levelsRes);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-section text-center text-muted">Loading analytics...</div>;

  // Prepare data for the company comparison chart
  const companyChartData = stdLevels?.market_averages?.map(level => {
    const row = { level: level.standardized_level };
    row['Market Avg'] = level.avg_total;
    // Add each company's data at this level
    stdLevels?.companies?.forEach(c => {
      const match = c.levels.find(l => l.standardized_level === level.standardized_level);
      if (match) row[c.company] = match.avg_total;
    });
    return row;
  }) || [];

  const companyNames = stdLevels?.companies?.map(c => c.company) || [];
  const COLORS = ['#111111', '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

  // Prepare selected company breakdown
  const selectedCompanyData = selectedCompany 
    ? stdLevels?.companies?.find(c => c.company === selectedCompany)
    : null;

  return (
    <div className="max-w-[1200px] mx-auto w-full px-lg py-section flex flex-col gap-xl">
      <div>
        <h1 className="text-display-lg font-display text-ink mb-sm">Market Analytics</h1>
        <p className="text-body-md text-muted">Visualize compensation distributions and trends across standardized levels.</p>
      </div>

      {/* Market Averages by Standardized Level */}
      {stdLevels?.market_averages?.length > 0 && (
        <Card variant="product-mockup" className="flex flex-col gap-md">
          <div className="border-b border-hairline pb-sm">
            <h2 className="text-title-md font-semibold text-ink">Average TC by Standardized Level</h2>
            <p className="text-body-sm text-muted">Market-wide average total compensation across experience bands.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-sm">
            {stdLevels.market_averages.map(level => (
              <div key={level.standardized_level} className="bg-surface-soft rounded-md p-md flex flex-col items-center gap-xs">
                <span className="text-caption text-muted font-semibold uppercase tracking-wider">{level.standardized_level}</span>
                <span className="text-title-md font-display text-ink">{formatCurrency(level.avg_total)}</span>
                <span className="text-caption text-muted">{level.count} records</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Company Comparison Chart */}
      {companyChartData.length > 0 && (
        <Card variant="product-mockup" className="flex flex-col gap-md">
          <div className="border-b border-hairline pb-sm">
            <h2 className="text-title-md font-semibold text-ink">TC Progression by Company</h2>
            <p className="text-body-sm text-muted">How total compensation scales across standardized levels at each company.</p>
          </div>
          <div className="h-[350px] w-full mt-sm">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={companyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="level" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13 }} dy={10} />
                <YAxis 
                  tickFormatter={(val) => formatCurrency(val)} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 13 }}
                  dx={-10}
                />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="Market Avg" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
                {companyNames.map((name, i) => (
                  <Line key={name} type="monotone" dataKey={name} stroke={COLORS[(i + 1) % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Per-Company Drill Down */}
      {stdLevels?.companies?.length > 0 && (
        <Card variant="product-mockup" className="flex flex-col gap-md">
          <div className="border-b border-hairline pb-sm">
            <h2 className="text-title-md font-semibold text-ink">Company Level Breakdown</h2>
            <p className="text-body-sm text-muted">Select a company to see average compensation components at each standardized level.</p>
          </div>

          <div className="flex flex-wrap gap-sm">
            {stdLevels.companies.map(c => (
              <button
                key={c.company}
                onClick={() => setSelectedCompany(selectedCompany === c.company ? null : c.company)}
                className={`px-3 py-1.5 rounded-md text-body-sm font-medium border transition-colors capitalize ${
                  selectedCompany === c.company
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-canvas text-muted border-hairline hover:text-ink hover:border-ink'
                }`}
              >
                {c.company}
              </button>
            ))}
          </div>

          {selectedCompanyData && (
            <div className="mt-sm">
              <div className="overflow-x-auto rounded-lg border border-hairline">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-hairline bg-surface-soft">
                      <th className="px-lg py-md text-title-sm text-ink font-semibold">Std Level</th>
                      <th className="px-lg py-md text-title-sm text-ink font-semibold">Company Levels</th>
                      <th className="px-lg py-md text-title-sm text-ink font-semibold">Avg Base</th>
                      <th className="px-lg py-md text-title-sm text-ink font-semibold">Avg Bonus</th>
                      <th className="px-lg py-md text-title-sm text-ink font-semibold">Avg Stock</th>
                      <th className="px-lg py-md text-title-sm text-ink font-semibold">Avg Total</th>
                      <th className="px-lg py-md text-title-sm text-ink font-semibold">Records</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCompanyData.levels.map(level => (
                      <tr key={level.standardized_level} className="border-b border-hairline-soft hover:bg-surface-soft transition-colors">
                        <td className="px-lg py-md">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-primary text-on-primary text-caption font-semibold">
                            {level.standardized_level}
                          </span>
                        </td>
                        <td className="px-lg py-md text-body-sm text-muted">
                          {level.company_levels_mapped.join(', ')}
                        </td>
                        <td className="px-lg py-md text-body-md text-ink font-medium">{formatCurrency(level.avg_base)}</td>
                        <td className="px-lg py-md text-body-md text-ink font-medium">{formatCurrency(level.avg_bonus)}</td>
                        <td className="px-lg py-md text-body-md text-ink font-medium">{formatCurrency(level.avg_stock)}</td>
                        <td className="px-lg py-md text-title-md text-ink font-semibold">{formatCurrency(level.avg_total)}</td>
                        <td className="px-lg py-md text-body-sm text-muted">{level.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Original Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <Card variant="product-mockup" className="flex flex-col gap-md">
          <div className="border-b border-hairline pb-sm">
            <h2 className="text-title-md font-semibold text-ink">Compensation by Company Level</h2>
            <p className="text-body-sm text-muted">Median total compensation by raw company levels.</p>
          </div>
          <div className="h-[300px] w-full mt-sm">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.compensationByLevel || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="level" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13 }} dy={10} />
                <YAxis 
                  tickFormatter={(val) => formatCurrency(val)} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 13 }}
                  dx={-10}
                />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Line type="monotone" dataKey="median" stroke="#111111" strokeWidth={3} dot={{ r: 5, fill: '#111111' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card variant="product-mockup" className="flex flex-col gap-md">
          <div className="border-b border-hairline pb-sm">
            <h2 className="text-title-md font-semibold text-ink">Total Compensation Distribution</h2>
            <p className="text-body-sm text-muted">Volume of offers across TC bands.</p>
          </div>
          <div className="h-[300px] w-full mt-sm">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.tcDistribution || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13 }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 13 }}
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ fill: '#f5f5f5' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey="count" fill="#111111" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Level Definitions */}
      <Card variant="product-mockup" className="flex flex-col gap-md">
        <div className="border-b border-hairline pb-sm">
          <h2 className="text-title-md font-semibold text-ink">Standardized Level Definitions</h2>
          <p className="text-body-sm text-muted">How we map years of experience to universal levels across all companies.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-sm">
          {[
            { level: 'L1', range: '0–2 years', desc: 'Entry' },
            { level: 'L2', range: '2–5 years', desc: 'Mid' },
            { level: 'L3', range: '5–10 years', desc: 'Senior' },
            { level: 'L4', range: '10–15 years', desc: 'Staff' },
            { level: 'L5', range: '15+ years', desc: 'Principal' },
          ].map(l => (
            <div key={l.level} className="bg-surface-soft rounded-md p-md flex flex-col items-center gap-xs text-center">
              <span className="inline-flex items-center px-2.5 py-1 rounded bg-primary text-on-primary text-title-sm font-bold">{l.level}</span>
              <span className="text-body-sm font-medium text-ink">{l.desc}</span>
              <span className="text-caption text-muted">{l.range}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
