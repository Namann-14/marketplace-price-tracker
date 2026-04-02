import axios from 'axios';

const API_KEY = import.meta.env.VITE_API_KEY as string;
const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'X-API-Key': API_KEY },
});

export default api;
