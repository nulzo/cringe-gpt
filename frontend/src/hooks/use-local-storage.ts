import {useCallback, useEffect, useSyncExternalStore,} from 'react';

function dispatchStorageEvent(key: string, newValue: string | null) {
    window.dispatchEvent(new StorageEvent('storage', {key, newValue}));
}

function safeStringify(value: any): string {
    return typeof value === 'string' ? value : JSON.stringify(value);
}

function safeParse<T>(value: string | null): T | null {
    if (value === null) return null;
    try {
        return JSON.parse(value) as T;
    } catch {
        return value as unknown as T;
    }
}

function getLocalStorageItem<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    return safeParse<T>(raw);
}

function setLocalStorageItem<T>(key: string, value: T): void {
    const serialized = safeStringify(value);
    localStorage.setItem(key, serialized);
    dispatchStorageEvent(key, serialized);
}

function removeLocalStorageItem(key: string): void {
    localStorage.removeItem(key);
    dispatchStorageEvent(key, null);
}

function useLocalStorageSubscribe(callback: EventListenerOrEventListenerObject) {
    window.addEventListener('storage', callback);
    return () => window.removeEventListener('storage', callback);
}

function getLocalStorageServerSnapshot(): never {
    throw new Error('useLocalStorage is a client-only hook');
}

type SetStateAction<T> = T | ((prev: T) => T);

export function useLocalStorage<T>(key: string, initialValue?: T): [T, (v: SetStateAction<T>) => void] {
    const getSnapshot = () => localStorage.getItem(key);

    const store = useSyncExternalStore(
        useLocalStorageSubscribe,
        getSnapshot,
        getLocalStorageServerSnapshot
    );

    const parsedStore = safeParse<T>(store) ?? initialValue!;

    const setState = useCallback(
        (value: SetStateAction<T>) => {
            try {
                const current = safeParse<T>(store);
                const nextState = typeof value === 'function' ? (value as (prev: T) => T)(current ?? initialValue!) : value;

                if (nextState === undefined || nextState === null) {
                    removeLocalStorageItem(key);
                } else {
                    setLocalStorageItem(key, nextState);
                }
            } catch (e) {
                console.warn(`Failed to update localStorage for key "${key}"`, e);
            }
        },
        [key, store, initialValue]
    );

    useEffect(() => {
        if (localStorage.getItem(key) === null && initialValue !== undefined) {
            setLocalStorageItem(key, initialValue);
        }
    }, [key, initialValue]);

    return [parsedStore, setState];
}
