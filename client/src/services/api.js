import axios from 'axios';

const API_BASE_URL = '/api';

export const api = {
  // Post new salary record (supports optional file upload)
  submitSalary: async (salaryData, offerFile = null) => {
    const formData = new FormData();

    // Map complex frontend state to strict Phase 2 backend payload
    formData.append('company', salaryData.company);
    formData.append('role', salaryData.title);
    formData.append('level', salaryData.level);
    formData.append('location', salaryData.location);
    formData.append('experience_years', parseFloat(salaryData.years_of_experience) || 0);
    formData.append('base_salary', parseFloat(salaryData.base_salary) || 0);
    formData.append('bonus', parseFloat(salaryData.bonus) || 0);
    formData.append('stock', salaryData.stock_grant_type === 'RSUs' ? (parseFloat(salaryData.rsu_yearly_average) || 0) : 0);
    formData.append('confidence_score', 80);

    // Attach offer letter file if provided
    if (offerFile) {
      formData.append('offer_letter', offerFile);
    }

    const response = await axios.post(`${API_BASE_URL}/ingest-salary`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Get all salaries (supports filtering via params)
  getSalaries: async (filters = {}) => {
    const response = await axios.get(`${API_BASE_URL}/salaries`, { params: filters });
    return response.data.data; // Return the array of records
  },

  // Get company analytics
  getCompany: async (companyName) => {
    const response = await axios.get(`${API_BASE_URL}/company/${companyName}`);
    return response.data.data;
  },

  // Compare salaries
  compareSalaries: async (id1, id2) => {
    const response = await axios.get(`${API_BASE_URL}/compare`, { params: { id1, id2 } });
    return response.data.data;
  },

  // Get top companies ranked by median TC (optional level filter)
  getTopCompanies: async (level) => {
    const params = level ? { level } : {};
    const response = await axios.get(`${API_BASE_URL}/top-companies`, { params });
    return response.data;
  },

  // Get analytics data (compensation by level + TC distribution)
  getAnalytics: async () => {
    const response = await axios.get(`${API_BASE_URL}/analytics`);
    return response.data;
  },

  // Get standardized level data (per-company and market averages)
  getStandardizedLevels: async () => {
    const response = await axios.get(`${API_BASE_URL}/standardized-levels`);
    return response.data.data;
  },

  // Get per-company internal level map for stacked comparison
  getLevelMap: async () => {
    const response = await axios.get(`${API_BASE_URL}/level-map`);
    return response.data.data;
  }
};
