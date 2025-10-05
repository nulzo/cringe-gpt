export type Settings = {
    id: number;
    email: string;
    avatar?: string;
    name?: string;
    provider?: string;
    settings: {
        theme?: 'light' | 'dark' | 'system';
        preferredModel?: string;
    };
}; 