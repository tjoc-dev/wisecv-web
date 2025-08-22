import axios from 'axios';

// API base URL - change this based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Fetches job search metrics - only accessible by admin users
 * @returns job search metrics data
 */
export const getJobSearchMetrics = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/wisecv/jobs/metrics`, {
      headers: {
        'x-app-name': 'wisecv'
      },
      withCredentials: true
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch job search metrics:', error);
    throw error;
  }
};

/**
 * Search for jobs based on query parameters
 * @param params search parameters (query, location, etc.)
 * @returns job search results
 */
export const searchJobs = async (params: Record<string, string>) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/wisecv/jobs/search`, {
      headers: {
        'x-app-name': 'wisecv'
      },
      params,
      withCredentials: true
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Failed to search for jobs:', error);
    throw error;
  }
};
