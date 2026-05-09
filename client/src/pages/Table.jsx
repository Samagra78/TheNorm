import React, { useState } from 'react';
import { useSalaries } from '../hooks/useSalaries';
import { SalaryTable } from '../components/ui/Table';
import { TextInput } from '../components/ui/TextInput';
import { NavPillGroup } from '../components/ui/NavPillGroup';

export function TablePage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchCompany, setSearchCompany] = useState('');
  
  const { data, loading, setFilters } = useSalaries();

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ company: searchCompany });
  };

  const handleTabChange = (val) => {
    setActiveTab(val);
    if (val === 'all') setFilters({});
    else setFilters({ role: val });
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full px-lg py-section flex flex-col gap-xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div>
          <h1 className="text-display-lg font-display text-ink mb-sm">Compensation Data</h1>
          <p className="text-body-md text-muted">Browse verified salary data filtered by role and level.</p>
        </div>
        
        <form onSubmit={handleSearch} className="flex items-center gap-sm">
          <TextInput 
            placeholder="Search company..." 
            value={searchCompany}
            onChange={(e) => setSearchCompany(e.target.value)}
          />
        </form>
      </div>

      <div className="flex justify-center md:justify-start">
        <NavPillGroup 
          activeItem={activeTab}
          onChange={handleTabChange}
          items={[
            { label: 'All Roles', value: 'all' },
            { label: 'Software Engineering', value: 'Software Engineer' },
            { label: 'Product Management', value: 'Product Manager' },
          ]}
        />
      </div>

      <SalaryTable data={data} loading={loading} />
    </div>
  );
}
