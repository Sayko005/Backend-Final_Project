// src/axios.js
import axios from 'axios';
import { token } from '@/store';

const instance = axios.create({
  baseURL: 'http://localhost:5000'
});

// Before each request, set Authorization header if we have a token
instance.interceptors.request.use(
  (config) => {
    if (token.value) {
      config.headers.Authorization = `Bearer ${token.value}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
