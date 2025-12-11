type JwtPayload = { exp?: number } & Record<string, unknown>;

function parseJwt(token: string): JwtPayload | null {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

export function isJwtExpired(token: string, clockSkewSeconds = 120): boolean {
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return now >= (payload.exp - clockSkewSeconds);
}


