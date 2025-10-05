import type {Citation} from '../types';

/**
 * Add inline citation markers to content
 */
export const addInlineCitations = (content: string, citations: Citation[]): string => {
    if (!content || !citations || citations.length === 0) {
        return content;
    }

    let processedContent = content;

    // Clean up the content first
    processedContent = processedContent
        .replace(/\u0000/g, '') // Remove null characters
        .replace(/e:$/g, ''); // Remove trailing 'e:'

    // Add citation numbers to the content
    citations.forEach((citation, index) => {
        const citationNumber = index + 1;
        const citationMarker = `[${citationNumber}]`;

        // Try to find a good place to insert the citation marker
        // This is a simple implementation - you might want to make it more sophisticated
        if (citation.text && citation.text.trim()) {
            const cleanedCitationText = citation.text.trim();

            // If the citation text appears in the content, add the marker after it
            const citationIndex = processedContent.indexOf(cleanedCitationText);
            if (citationIndex !== -1) {
                const insertIndex = citationIndex + cleanedCitationText.length;
                processedContent =
                    processedContent.slice(0, insertIndex) +
                    ` ${citationMarker}` +
                    processedContent.slice(insertIndex);
            }
        }
    });

    return processedContent;
};

/**
 * Force inline citations even if not naturally placed
 */
export const forceInlineCitations = (content: string, citations: Citation[]): string => {
    if (!content || !citations || citations.length === 0) {
        return content;
    }

    let processedContent = content;

    // Clean up the content first
    processedContent = processedContent
        .replace(/\u0000/g, '')
        .replace(/e:$/g, '');

    // Add citations at the end if they weren't naturally placed
    const citationMarkers = citations
        .map((_, index) => `[${index + 1}]`)
        .join(' ');

    if (citationMarkers) {
        processedContent += ` ${citationMarkers}`;
    }

    return processedContent;
};

/**
 * Extract and clean citations from a message
 */
export const processCitations = (citations: Citation[]): Citation[] => {
    if (!citations || citations.length === 0) {
        return [];
    }

    return citations.map(citation => {
        const cleanedCitation = {...citation};

        if (cleanedCitation.text) {
            // Clean up the text
            cleanedCitation.text = cleanedCitation.text
                .replace(/\u0000/g, '')
                .replace(/(\[\?+\]|\[0+\])+/g, '')
                .replace(/undefined\]/g, '')
                .replace(/\[undefined\]/g, '')
                .replace(/\[\d+\]\[\d+\]\[\d+\]/g, '')
                .replace(/\[\d+\]\s*\[\d+\]/g, '')
                .trim();

            // If the text is now empty, use a fallback
            if (!cleanedCitation.text) {
                cleanedCitation.text = cleanedCitation.metadata?.source ||
                    cleanedCitation.metadata?.citation ||
                    `Source ${cleanedCitation.chunk_id}`;
            }
        }

        return cleanedCitation;
    });
};

/**
 * Check if content has citation markers
 */
export const hasCitationMarkers = (content: string): boolean => {
    if (!content) return false;

    // Look for citation patterns like [1], [2], etc.
    const citationPattern = /\[\d+\]/g;
    return citationPattern.test(content);
}; 