import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home } from './pages/Home';
import { TablePage } from './pages/Table';
import { CompanyPage } from './pages/Company';
import { ComparePage } from './pages/Compare';
import { TopCompanies } from './pages/TopCompanies';
import { Analytics } from './pages/Analytics';
import { AddSalary } from './pages/AddSalary';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-canvas flex flex-col">
        {/* Top Nav */}
        <header className="h-[64px] bg-canvas flex items-center px-lg border-b border-hairline-soft sticky top-0 z-10">
          {/* Left: Logo */}
          <div className="flex-1 flex items-center">
            <Link to="/" className="flex items-center gap-xs">
              <img src="/logo.svg" alt="TheNorm Logo" className="h-[28px] w-auto" />
              <span className="font-display font-semibold text-ink text-xl tracking-tight">TheNorm</span>
            </Link>
          </div>

          {/* Center: Navigation */}
          <nav className="hidden md:flex items-center justify-center gap-xl flex-1">
            <Link to="/table" className="text-[14px] font-medium text-muted hover:text-ink transition-colors">Salaries</Link>
            <Link to="/compare" className="text-[14px] font-medium text-muted hover:text-ink transition-colors">Compare</Link>
            <Link to="/top-companies" className="text-[14px] font-medium text-muted hover:text-ink transition-colors">Leaderboard</Link>
            <Link to="/analytics" className="text-[14px] font-medium text-muted hover:text-ink transition-colors">Analytics</Link>
          </nav>

          {/* Right: Actions */}
          <div className="flex-1 flex items-center justify-end">
             <Link to="/add-salary" className="hidden md:inline-flex bg-primary text-on-primary hover:bg-primary-active px-4 py-2 rounded-md text-[14px] font-semibold transition-colors">
               Add Salary
             </Link>
          </div>
        </header>

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/table" element={<TablePage />} />
            <Route path="/company/:id" element={<CompanyPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/top-companies" element={<TopCompanies />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/add-salary" element={<AddSalary />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-surface-dark text-on-dark-soft py-section px-lg mt-section border-t border-surface-dark-elevated">
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-xl">
            <div className="flex flex-col gap-sm">
              <span className="font-display font-semibold text-on-dark text-xl tracking-tight">TheNorm</span>
              <p className="text-body-sm text-on-dark-soft">Standardizing compensation data for the tech industry.</p>
            </div>
            <div className="flex flex-col gap-sm">
              <span className="text-body-sm font-semibold text-on-dark">Product</span>
              <Link to="/table" className="text-body-sm hover:text-on-dark transition-colors">Salaries</Link>
              <Link to="/compare" className="text-body-sm hover:text-on-dark transition-colors">Compare Offers</Link>
              <Link to="/top-companies" className="text-body-sm hover:text-on-dark transition-colors">Leaderboards</Link>
              <Link to="/analytics" className="text-body-sm hover:text-on-dark transition-colors">Analytics</Link>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
