import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { queryClient } from '@/lib/query';
import type { AuthResponse } from '@/types/api';
import type { UserDto } from '@/DTOs/auth';
import { isJwtExpired } from '@/lib/jwt';

export type LoginInput = {
    usernameOrEmail: string;
    password: string;
};

export type RegisterInput = {
    username: string;
    email: string;
    password: string;
};

async function setToken(token: string | null) {
    if (token) {
        localStorage.setItem('token', token);
        (api as any).defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        localStorage.removeItem('token');
        if ((api as any)?.defaults?.headers?.common) {
            delete (api as any).defaults.headers.common['Authorization'];
        }
    }
}

export async function getMe(): Promise<UserDto | null> {
    try {
        const user = await api.get<UserDto>('/users/me');
        return user;
    } catch {
        return null;
    }
}

export async function login(input: LoginInput): Promise<UserDto> {
    const res = await api.post<AuthResponse>('/auth/login', input);
    await setToken(res.token);

    const user = await getMe();
    if (!user) throw new Error('Unable to fetch user after login');

    useAuthStore.getState().setAuth(user, res.token);
    return user;
}

export async function register(input: RegisterInput): Promise<UserDto> {
    const res = await api.post<AuthResponse>('/auth/register', input);
    await setToken(res.token);

    const user = await getMe();
    if (!user) throw new Error('Unable to fetch user after register');

    useAuthStore.getState().setAuth(user, res.token);
    return user;
}

export async function logout(): Promise<void> {
    try {
        await api.post('/auth/logout');
    } catch {
        // ignore network errors on logout
    }
    await setToken(null);
    useAuthStore.getState().clearAuth();
    queryClient.removeQueries();
}

export async function bootstrapAuthFromStorage() {
    const token = localStorage.getItem('token');
    if (!token) return;
    // Drop expired tokens eagerly to avoid 401 loops
    if (isJwtExpired(token)) {
        try { localStorage.removeItem('token'); } catch {}
        useAuthStore.getState().clearAuth();
        return;
    }
    // Set header immediately for early requests
    (api as any).defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // Set token in store so guards allow rendering
    try {
        useAuthStore.setState({ token });
    } catch { }
    // Try to hydrate user
    try {
        const user = await getMe();
        if (user) {
            useAuthStore.getState().setAuth(user, token);
        } else {
            await setToken(null);
            useAuthStore.getState().clearAuth();
        }
    } catch {
        await setToken(null);
        useAuthStore.getState().clearAuth();
    }
}
