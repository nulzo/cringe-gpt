import { useEffect } from 'react';

export const useUnsavedPrompt = (isDirty: boolean) => {
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (!isDirty) return;
            e.preventDefault();
            // Chrome requires returnValue to be set.
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [isDirty]);
};