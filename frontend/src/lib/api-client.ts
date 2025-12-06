import Axios, { AxiosHeaders, type InternalAxiosRequestConfig, } from 'axios';

import { env } from '@/configuration/env';
import { BASE_API, BASE_API_VERSION } from '@/configuration/const';
import { useErrorStore } from '@/stores/error-store';
import { ERROR_CANNOT_CONNECT_TO_BACKEND } from '@/configuration/errors';
import { useAuthStore } from '@/stores/auth-store';


function authRequestInterceptor(config: InternalAxiosRequestConfig) {
    const token = localStorage.getItem('token');

    if (!(config.headers instanceof AxiosHeaders)) {
        config.headers = new AxiosHeaders(config.headers);
    }

    config.withCredentials = true;

    config.headers.set('Content-Type', 'application/json');

    const isStreaming = config.headers.get('Accept') === 'text/event-stream';
    config.headers.set('Accept', isStreaming ? 'text/event-stream' : 'application/json');

    if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
    }

    return config;
}

const resolvedBaseUrl = ((): string => {
    const apiPath = `${BASE_API}/${BASE_API_VERSION}`; // e.g. api/v1
    if (import.meta.env.MODE === 'production') return `/${apiPath}`;
    // In dev, rely on VITE_APP_API_URL to target backend directly
    return `${env.API_URL}/${apiPath}`;
})();

export const api = Axios.create({
    baseURL: resolvedBaseUrl,
});

api.interceptors.request.use(authRequestInterceptor);

api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const { token, isInitialized } = useAuthStore.getState();
        if (error.response?.status === 401) {
            const requestUrl: string = error.config?.url || '';
            const wwwAuth: string | undefined = error.response?.headers?.['www-authenticate'] || error.response?.headers?.['WWW-Authenticate'];
            const invalidToken = typeof wwwAuth === 'string' && /invalid_token|expired/i.test(wwwAuth);

            const shouldLogout = invalidToken || requestUrl.startsWith('/auth') || requestUrl.includes('/users/me');
            // Avoid nuking local state before hydration finishes; let bootstrap handle stale tokens.
            if (shouldLogout && isInitialized) {
                try {
                    localStorage.removeItem('token');
                    if ((api as any)?.defaults?.headers?.common) {
                        delete (api as any).defaults.headers.common['Authorization'];
                    }
                } catch { }
                useAuthStore.getState().clearAuth();
            }
        }

        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
            console.error('Server unreachable (connection refused)');
            useErrorStore.getState().setGlobalError(ERROR_CANNOT_CONNECT_TO_BACKEND);
        }

        return Promise.reject(error);
    }
);
