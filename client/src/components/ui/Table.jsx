import React from 'react';
import { cn } from '../../utils/cn';
import { formatCurrency, standardizeLevel, capitalizeCompany } from '../../utils/formatters';
import { Badge } from './Badge';

export const SalaryTable = ({ data, loading }) => {
  if (loading) {
    return <div className="p-xl text-center text-muted">Loading compensation data...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="p-xl text-center text-muted">No data found matching your criteria.</div>;
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-hairline bg-canvas">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-hairline bg-surface-soft">
            <th className="px-lg py-md text-title-sm text-ink font-semibold whitespace-nowrap">Company & Role</th>
            <th className="px-lg py-md text-title-sm text-ink font-semibold">Level</th>
            <th className="px-lg py-md text-title-sm text-ink font-semibold">Total Compensation</th>
            <th className="px-lg py-md text-caption text-muted font-medium whitespace-nowrap">Base | Bonus | Stock</th>
            <th className="px-lg py-md text-title-sm text-ink font-semibold">Location / YOE</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="border-b border-hairline-soft hover:bg-surface-soft transition-colors">
              <td className="px-lg py-md">
                <div className="text-body-md font-semibold text-ink">{capitalizeCompany(row.company)}</div>
                <div className="text-body-sm text-muted">{row.role}</div>
              </td>
              <td className="px-lg py-md">
                <Badge variant="emerald">{row.standardized_level || standardizeLevel(row.level)}</Badge>
                <div className="text-caption text-muted mt-1">{row.level}</div>
              </td>
              <td className="px-lg py-md">
                <div className="text-title-md text-ink font-semibold">
                  {formatCurrency(row.total_compensation, row.location)}
                </div>
              </td>
              <td className="px-lg py-md text-body-sm text-muted">
                {formatCurrency(row.base_salary, row.location)} | {formatCurrency(row.bonus, row.location)} | {formatCurrency(row.stock, row.location)}
              </td>
              <td className="px-lg py-md">
                <div className="text-body-md text-ink">{row.location}</div>
                <div className="text-body-sm text-muted">{row.experience_years} YOE</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
