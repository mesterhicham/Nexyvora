import axios from 'axios';

export const getApiBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    return '/api';
};

export const resolveAssetUrl = (url?: string | null): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('http://localhost:5001') || url.startsWith('http://127.0.0.1:5001')) {
        return url.replace(/^https?:\/\/[^/]+:5001/, '');
    }
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return url.startsWith('/') ? url : `/${url}`;
};

const api = axios.create({
    baseURL: getApiBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the JWT token to headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle unauthorized errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthRequest = error.config?.url?.includes('/auth/login');
        const isAuthPage = window.location.pathname.includes('/auth') || window.location.pathname.includes('/login');

        if (error.response?.status === 401 && !isAuthRequest && !isAuthPage) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Use a slight delay or check to avoid aggressive looping
            if (window.location.pathname !== '/auth') {
                window.location.href = '/auth';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
