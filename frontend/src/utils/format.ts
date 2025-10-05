/**
 * Format a timestamp into a human-readable date string
 */
export const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Handle future dates by showing the actual date
    if (diffInSeconds < 0) {
        const isThisYear = date.getFullYear() === now.getFullYear();
        if (isThisYear) {
            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            });
        }
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    // Less than a minute ago
    if (diffInSeconds < 60) {
        return "Just now";
    }

    // Less than an hour ago
    if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m ago`;
    }

    // Less than a day ago
    if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h ago`;
    }

    // Less than a week ago
    if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d ago`;
    }

    // More than a week ago - show actual date
    const isThisYear = date.getFullYear() === now.getFullYear();

    if (isThisYear) {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

/**
 * Format a date for detailed display (tooltips, etc.)
 */
export const formatDetailedDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

/**
 * Format file size in bytes to human readable format
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format number with commas
 */
export const formatNumber = (num: number): string => {
    return num.toLocaleString();
};

/**
 * Format cost in USD
 */
export const formatCost = (cost: number): string => {
    if (cost < 0.01) {
        return '<$0.01';
    }
    return `$${cost.toFixed(4)}`;
};

/**
 * Truncate text to a specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
};

/**
 * Clean citation text by removing problematic patterns
 */
export const cleanCitationText = (text: string): string => {
    if (!text) return '';

    return text
        // Remove Unicode null characters
        .replace(/\u0000/g, '')
        // Remove sequences of [?] or [0]
        .replace(/(\[\?+\]|\[0+\])+/g, '')
        // Remove undefined] text
        .replace(/undefined\]/g, '')
        // Remove [undefined] text
        .replace(/\[undefined\]/g, '')
        // Remove sequences of [n][n][n]
        .replace(/\[\d+\]\[\d+\]\[\d+\]/g, '')
        // Remove sequences of [n] [n]
        .replace(/\[\d+\]\s*\[\d+\]/g, '')
        .trim();
};

// Get Time-to-greeting via Locale
export const getTimeToGreeting = (): string => {
    const now = new Date();
    const hours = now.getHours();
    if (hours < 12) {
        return 'Good Morning';
    } else if (hours < 18) {
        return 'Good Afternoon';
    } else {
        return 'Good Evening';
    }
};