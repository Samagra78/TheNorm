import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { api } from '../services/api';
import { capitalizeCompany } from '../utils/formatters';

export function Home() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    api.getSalaries().then(data => {
      const unique = [...new Set(data.map(s => capitalizeCompany(s.company)))];
      setCompanies(unique);
    }).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Band */}
      <section className="py-section px-lg max-w-[1200px] mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-xl items-center">
        <div className="md:col-span-7 flex flex-col gap-lg">
          <Badge variant="emerald" className="self-start">Verified Data</Badge>
          <h1 className="text-display-xl text-ink font-display">
            The better way to benchmark your compensation
          </h1>
          <p className="text-body-md text-muted">
            Stop guessing your market worth. We standardize levels across the tech industry so you can compare Total Compensation accurately.
          </p>

          {/* Company Search */}
          <div className="w-full">
            <label className="block text-body-sm font-semibold text-ink mb-1">Search a company</label>
            <SearchableSelect
              options={companies}
              value=""
              onChange={(val) => { if (val) navigate(`/company/${val}`); }}
              placeholder="e.g. Google, Meta, Amazon..."
            />
          </div>

          <div className="flex items-center gap-md pt-sm">
            <Button onClick={() => navigate('/table')}>Explore Salaries</Button>
            <Button variant="secondary" onClick={() => navigate('/compare')}>Compare Levels</Button>
          </div>
        </div>
        <div className="md:col-span-5">
          <Card variant="product-mockup" className="shadow-lg transform rotate-1 hover:rotate-0 transition-transform">
            <div className="flex flex-col gap-md">
              <div className="flex justify-between items-center border-b border-hairline pb-sm">
                <span className="font-semibold text-ink">Software Engineer</span>
                <Badge variant="orange">L5 / Senior</Badge>
              </div>
              <div>
                <div className="text-muted text-caption">Total Compensation</div>
                <div className="text-display-sm text-ink">$365,000</div>
              </div>
              <div className="flex flex-col gap-xs text-body-sm text-muted">
                <div className="flex justify-between"><span>Base</span><span className="font-medium text-ink">$185k</span></div>
                <div className="flex justify-between"><span>Bonus</span><span className="font-medium text-ink">$60k</span></div>
                <div className="flex justify-between"><span>Stock (/yr)</span><span className="font-medium text-ink">$120k</span></div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-section px-lg bg-canvas border-t border-hairline-soft">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-xl">
          <h2 className="text-display-lg text-ink font-display text-center">
            Built for accuracy and insight
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            <Card variant="feature">
              <div className="h-10 w-10 bg-badge-violet rounded-full mb-md flex items-center justify-center text-ink font-bold">L</div>
              <h3 className="text-title-md text-ink mb-sm">Standardized Levels</h3>
              <p className="text-body-md text-muted">We map internal company titles to standardized bands, so you can compare an E4 at Meta to an L4 at Google.</p>
            </Card>
            <Card variant="feature">
              <div className="h-10 w-10 bg-badge-emerald rounded-full mb-md flex items-center justify-center text-ink font-bold">$</div>
              <h3 className="text-title-md text-ink mb-sm">TC Breakdown</h3>
              <p className="text-body-md text-muted">Don't just look at base pay. We break down every offer into Base, Target Bonus, and Annual Stock grants.</p>
            </Card>
            <Card variant="feature">
              <div className="h-10 w-10 bg-badge-pink rounded-full mb-md flex items-center justify-center text-ink font-bold">✓</div>
              <h3 className="text-title-md text-ink mb-sm">Verified Offers</h3>
              <p className="text-body-md text-muted">Our data comes from verified offer letters and W2s, ensuring the highest fidelity in market intelligence.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section className="py-section px-lg">
        <div className="max-w-[1000px] mx-auto bg-surface-card rounded-lg p-xxl text-center flex flex-col items-center gap-lg">
          <h2 className="text-display-sm font-display text-ink">Ready to know your worth?</h2>
          <p className="text-body-md text-muted">Browse our comprehensive database of compensation data.</p>
          <Button onClick={() => navigate('/table')}>View Salaries</Button>
        </div>
      </section>
    </div>
  );
}
