import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TextInput } from '../components/ui/TextInput';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { getCurrencySymbol } from '../utils/formatters';

// --- MOCK DATA ---
const MOCK_COMPANIES = {
  "Google": ["L3", "L4", "L5", "L6", "L7", "L8"],
  "Meta": ["E3", "E4", "E5", "E6", "E7", "E8"],
  "Amazon": ["SDE I", "SDE II", "SDE III", "Principal", "Senior Principal"],
  "Netflix": ["Junior", "Senior", "Staff", "Principal"],
  "Stripe": ["L1", "L2", "L3", "L4", "L5"],
};

const MOCK_TITLES = {
  "Software Engineer": { family: "Engineering", specs: ["Backend", "Frontend", "Fullstack", "iOS", "Android", "ML"] },
  "Product Manager": { family: "Product", specs: ["Growth", "Platform", "Consumer", "Enterprise"] },
  "Data Scientist": { family: "Data", specs: ["Analytics", "Algorithms", "Inference"] },
  "Product Designer": { family: "Design", specs: ["UX", "UI", "Research", "Motion"] },
};

const MOCK_JOB_FAMILIES = Array.from(new Set(Object.values(MOCK_TITLES).map(t => t.family)));

const MOCK_LOCATIONS = [
  "San Francisco, CA, USA",
  "Mountain View, CA, USA",
  "Seattle, WA, USA",
  "New York, NY, USA",
  "London, LND, UK",
  "Bengaluru, KA, India",
  "Remote, NA, Global"
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const CURRENT_YEAR = new Date().getFullYear();
const PAST_5_YEARS = Array.from({length: 6}, (_, i) => String(CURRENT_YEAR - i));

export function AddSalary() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [offerFile, setOfferFile] = useState(null);
  
  const [formData, setFormData] = useState({
    company: '',
    job_family: '',
    title: '',
    specialization: '',
    level: '',
    
    // Status
    employment_status: 'New Offer', // 'New Offer' | 'Employee'
    still_employed: 'Yes', // 'Yes' | 'No'
    
    // Dates
    month: '',
    year: '',
    exit_month: '',
    exit_year: '',
    
    // Experience
    years_at_company: '',
    years_of_experience: '',
    location: '',
    arrangement: '',
    
    // Compensation
    employment_type: 'Full Time',
    base_salary: '',
    interval: 'Yearly',
    
    // Stock
    stock_grant_type: 'None',
    rsu_yearly_average: '',
    
    // Additional
    bonus: '',
  });

  // Derived state options
  const availableLevels = formData.company ? MOCK_COMPANIES[formData.company] : [];
  
  let availableSpecs = [];
  if (formData.title) {
    availableSpecs = MOCK_TITLES[formData.title].specs;
  } else if (formData.job_family) {
    Object.keys(MOCK_TITLES).forEach(t => {
      if (MOCK_TITLES[t].family === formData.job_family) {
        availableSpecs.push(...MOCK_TITLES[t].specs);
      }
    });
  } else {
    Object.keys(MOCK_TITLES).forEach(t => {
      availableSpecs.push(...MOCK_TITLES[t].specs);
    });
  }
  const availableTitles = formData.job_family 
    ? Object.keys(MOCK_TITLES).filter(t => MOCK_TITLES[t].family === formData.job_family)
    : Object.keys(MOCK_TITLES);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      
      // Handle Job Family logic
      if (name === 'job_family') {
        // if currently selected title doesn't match new family, clear it
        if (next.title && MOCK_TITLES[next.title].family !== value) {
          next.title = '';
          next.specialization = '';
        }
      }
      
      // Auto-fill Job Family from Title
      if (name === 'title' && value) {
        next.job_family = MOCK_TITLES[value].family;
        next.specialization = ''; // Reset spec when title changes
      } else if (name === 'title' && !value) {
        next.specialization = '';
      }
      
      // Reset level when company changes
      if (name === 'company') {
        next.level = '';
      }
      
      // Auto-fill Title and Job Family from Specialization
      if (name === 'specialization' && value) {
        const matchedTitle = Object.keys(MOCK_TITLES).find(t => MOCK_TITLES[t].specs.includes(value));
        if (matchedTitle) {
          next.title = matchedTitle;
          next.job_family = MOCK_TITLES[matchedTitle].family;
        }
      }
      
      // Ensure Total YoE is not less than Years at Company
      if (name === 'years_at_company') {
        const yac = parseFloat(value) || 0;
        const yoe = parseFloat(next.years_of_experience) || 0;
        if (yoe < yac) {
          next.years_of_experience = value;
        }
      }
      
      return next;
    });
  };

  const handleSelectChange = (name, value) => {
    handleChange({ target: { name, value } });
  };

  const handleRadio = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = { ...formData };
      const result = await api.submitSalary(payload, offerFile);
      setSuccess(true);
      if (result.verification) {
        console.log('Verification result:', result.verification);
      }
      setTimeout(() => navigate('/table'), 3000);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.details || err.response?.data?.error || 'Failed to submit salary data.';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-[800px] mx-auto w-full px-lg py-section text-center">
        <div className="h-16 w-16 bg-success rounded-full flex items-center justify-center text-on-primary text-xl font-bold mx-auto mb-lg">✓</div>
        <h1 className="text-display-md font-display text-ink mb-sm">Thank You!</h1>
        <p className="text-body-lg text-muted">Your compensation data has been securely and anonymously submitted.</p>
        <p className="text-body-md text-muted mt-sm">Redirecting you to the verified salaries...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto w-full px-lg py-section flex flex-col gap-xl">
      <div>
        <h1 className="text-display-lg font-display text-ink mb-sm">Add Your Salary</h1>
        <p className="text-body-md text-muted">Contribute anonymously to help build a transparent compensation market.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-xl">
        {/* Verification Card */}
        <Card variant="product-mockup" className="flex flex-col gap-sm bg-surface-soft !p-md">
          <div className="border-b border-hairline pb-xs">
            <h2 className="text-title-sm font-semibold text-ink flex items-center gap-2">
              Verify Your Offer
              <span className="text-[11px] font-medium text-muted bg-canvas px-1.5 rounded-md border border-hairline">Optional</span>
            </h2>
            <p className="text-caption text-muted mt-1">Uploading your offer letter anonymously verifies your data, helping keep our compensation insights accurate.</p>
          </div>
          <div className="flex flex-col gap-xs pt-1">
            <input 
              type="file" 
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setOfferFile(e.target.files[0])}
              className="text-body-sm text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-on-primary hover:file:bg-primary-active cursor-pointer w-full" 
            />
          </div>
        </Card>

        {/* SECTION 1: Job Details */}
        <Card variant="product-mockup" className="flex flex-col gap-lg">
          <div className="border-b border-hairline pb-sm">
            <h2 className="text-title-md font-semibold text-ink">Job Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs md:col-span-2">
              <label className="text-body-sm font-semibold text-ink">Company</label>
              <SearchableSelect name="company" options={Object.keys(MOCK_COMPANIES)} value={formData.company} onChange={(v) => handleSelectChange('company', v)} placeholder="Select a company" />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-body-sm font-semibold text-ink">Job Family</label>
              <SearchableSelect name="job_family" options={MOCK_JOB_FAMILIES} value={formData.job_family} onChange={(v) => handleSelectChange('job_family', v)} placeholder="Select job family" />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-body-sm font-semibold text-ink">Title</label>
              <SearchableSelect name="title" options={availableTitles} value={formData.title} onChange={(v) => handleSelectChange('title', v)} placeholder="Select a title" />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-body-sm font-semibold text-ink">Specialization</label>
              <SearchableSelect name="specialization" options={availableSpecs} value={formData.specialization} onChange={(v) => handleSelectChange('specialization', v)} placeholder="Select specialization" />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-body-sm font-semibold text-ink">Level</label>
              <SearchableSelect name="level" options={availableLevels} value={formData.level} onChange={(v) => handleSelectChange('level', v)} placeholder="Select level" disabled={!formData.company} />
            </div>
          </div>
        </Card>

        {/* SECTION 2: Employment Status */}
        <Card variant="product-mockup" className="flex flex-col gap-lg">
          <div className="border-b border-hairline pb-sm">
            <h2 className="text-title-md font-semibold text-ink">Employment Status</h2>
          </div>
          
          <div className="flex gap-lg border-b border-hairline pb-md">
            <label className="flex items-center gap-xs cursor-pointer">
              <input type="radio" name="employment_status" checked={formData.employment_status === 'Employee'} onChange={() => handleRadio('employment_status', 'Employee')} className="accent-primary" />
              <span className="text-body-sm text-ink font-medium">Current/Former Employee</span>
            </label>
            <label className="flex items-center gap-xs cursor-pointer">
              <input type="radio" name="employment_status" checked={formData.employment_status === 'New Offer'} onChange={() => handleRadio('employment_status', 'New Offer')} className="accent-primary" />
              <span className="text-body-sm text-ink font-medium">New Offer</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {formData.employment_status === 'New Offer' && (
              <>
                <div className="flex flex-col gap-xs">
                  <label className="text-body-sm font-semibold text-ink">Offer Month</label>
                  <SearchableSelect name="month" options={MONTHS} value={formData.month} onChange={(v) => handleSelectChange('month', v)} placeholder="Select month" />
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="text-body-sm font-semibold text-ink">Offer Year</label>
                  <SearchableSelect name="year" options={PAST_5_YEARS} value={formData.year} onChange={(v) => handleSelectChange('year', v)} placeholder="Select year" />
                </div>
              </>
            )}

            {formData.employment_status === 'Employee' && (
              <>
                <div className="flex flex-col gap-xs md:col-span-2">
                  <label className="text-body-sm font-semibold text-ink">Are you still employed here?</label>
                  <SearchableSelect name="still_employed" options={["Yes", "No"]} value={formData.still_employed} onChange={(v) => handleSelectChange('still_employed', v)} placeholder="Yes or No" />
                </div>
                
                {formData.still_employed === 'No' && (
                  <>
                    <div className="flex flex-col gap-xs">
                      <label className="text-body-sm font-semibold text-ink">Exit Month</label>
                      <SearchableSelect name="exit_month" options={MONTHS} value={formData.exit_month} onChange={(v) => handleSelectChange('exit_month', v)} placeholder="Select exit month" />
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className="text-body-sm font-semibold text-ink">Exit Year</label>
                      <SearchableSelect name="exit_year" options={PAST_5_YEARS} value={formData.exit_year} onChange={(v) => handleSelectChange('exit_year', v)} placeholder="Select exit year" />
                    </div>
                  </>
                )}
              </>
            )}

            <div className="flex flex-col gap-xs">
              <label className="text-body-sm font-semibold text-ink">Years at {formData.company || "Company"}</label>
              <TextInput name="years_at_company" type="number" min="0" step="0.1" value={formData.years_at_company} onChange={handleChange} placeholder="0" required />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-body-sm font-semibold text-ink">Total Years of Experience</label>
              <TextInput name="years_of_experience" type="number" min={formData.years_at_company || "0"} step="0.1" value={formData.years_of_experience} onChange={handleChange} placeholder="0" required />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-body-sm font-semibold text-ink">Location</label>
              <SearchableSelect name="location" options={MOCK_LOCATIONS} value={formData.location} onChange={(v) => handleSelectChange('location', v)} placeholder="Select location" />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-body-sm font-semibold text-ink">Arrangement</label>
              <SearchableSelect name="arrangement" options={["In Office", "Hybrid", "Remote"]} value={formData.arrangement} onChange={(v) => handleSelectChange('arrangement', v)} placeholder="Select arrangement" />
            </div>
          </div>
        </Card>

        {/* SECTION 3: Compensation Details */}
        <Card variant="product-mockup" className="flex flex-col gap-lg">
          <div className="border-b border-hairline pb-sm">
            <h2 className="text-title-md font-semibold text-ink">Compensation Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs">
              <label className="text-body-sm font-semibold text-ink">Employment Type</label>
              <SearchableSelect name="employment_type" options={["Full Time", "Contractor"]} value={formData.employment_type} onChange={(v) => handleSelectChange('employment_type', v)} placeholder="Select type" />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-body-sm font-semibold text-ink">Interval</label>
              <SearchableSelect name="interval" options={["Yearly", "Monthly", "Hourly"]} value={formData.interval} onChange={(v) => handleSelectChange('interval', v)} placeholder="Select interval" />
            </div>
            <div className="flex flex-col gap-xs md:col-span-2">
              <label className="text-body-sm font-semibold text-ink">Base Salary</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">{getCurrencySymbol(formData.location)}</span>
                <TextInput name="base_salary" type="number" min="0" className="pl-7 w-full" value={formData.base_salary} onChange={handleChange} placeholder="160000" required />
              </div>
            </div>
          </div>
        </Card>

        {/* SECTION 4: Stock Options */}
        <Card variant="product-mockup" className="flex flex-col gap-lg">
          <div className="border-b border-hairline pb-sm">
            <h2 className="text-title-md font-semibold text-ink">Stock Options</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs md:col-span-2">
              <label className="text-body-sm font-semibold text-ink">Stock Grant Type</label>
              <SearchableSelect name="stock_grant_type" options={["None", "RSUs"]} value={formData.stock_grant_type} onChange={(v) => handleSelectChange('stock_grant_type', v)} placeholder="Select type" />
            </div>
            
            {formData.stock_grant_type === 'RSUs' && (
              <div className="flex flex-col gap-xs md:col-span-2">
                <label className="text-body-sm font-semibold text-ink">Average Yearly Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">{getCurrencySymbol(formData.location)}</span>
                  <TextInput name="rsu_yearly_average" type="number" min="0" className="pl-7 w-full" value={formData.rsu_yearly_average} onChange={handleChange} placeholder="50000" required />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* SECTION 5: Additional Compensations */}
        <Card variant="product-mockup" className="flex flex-col gap-lg">
          <div className="border-b border-hairline pb-sm">
            <h2 className="text-title-md font-semibold text-ink">Additional Compensations</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs md:col-span-2">
              <label className="text-body-sm font-semibold text-ink">Bonus</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">{getCurrencySymbol(formData.location)}</span>
                <TextInput name="bonus" type="number" min="0" className="pl-7 w-full" value={formData.bonus} onChange={handleChange} placeholder="25000" />
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-md pt-sm pb-xl">
          <Button variant="secondary" type="button" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Compensation'}
          </Button>
        </div>
      </form>
    </div>
  );
}
