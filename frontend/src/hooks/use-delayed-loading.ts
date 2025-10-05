import {useEffect, useState} from "react";

/**
 * Shows `true` only if `isLoading` stays true for at least `delayMs` milliseconds.
 * Default delay is 500ms.
 */
export function useDelayedLoading(isLoading: boolean, delayMs = 500) {
    const [showLoading, setShowLoading] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (isLoading) {
            timer = setTimeout(() => {
                setShowLoading(true);
            }, delayMs);
        } else {
            setShowLoading(false);
        }

        return () => clearTimeout(timer);
    }, [isLoading, delayMs]);

    return showLoading;
}
