import { Timestamp } from 'firebase/firestore';

/**
 * Format a date from either a Firestore Timestamp or a JavaScript Date object
 */
export function formatDate(date: Timestamp | Date | any): string {
    if (!date) return 'N/A';

    try {
        let d: Date;

        if (date instanceof Timestamp) {
            d = date.toDate();
        } else if (date instanceof Date) {
            d = date;
        } else if (date.seconds && typeof date.toDate === 'function') {
            d = date.toDate();
        } else if (typeof date === 'string' || typeof date === 'number') {
            d = new Date(date);
        } else {
            // Handle plain objects that look like Timestamps (from some Firestore versions/JSON)
            if (date.seconds) {
                d = new Date(date.seconds * 1000);
            } else {
                return 'N/A';
            }
        }

        return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'N/A';
    }
}

/**
 * Converts any date format to a standard Date object
 */
export function toDate(date: Timestamp | Date | any): Date | null {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (date instanceof Timestamp) return date.toDate();
    if (date.seconds) return new Date(date.seconds * 1000);
    return new Date(date);
}
