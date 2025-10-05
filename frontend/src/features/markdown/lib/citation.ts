import type {Renderer} from 'marked';

const citationRule = /^\[cite:(.*?)\]/;

export function citationExtension() {
    return {
        name: 'inlineCitation',
        level: 'inline' as const,
        start(src: string) {
            return src.indexOf('[cite:');
        },
        tokenizer(src: string): any {
            const match = src.match(citationRule);
            if (match) {
                return {
                    type: 'inlineCitation',
                    raw: match[0],
                    citationId: match[1],
                };
            }
        },
        renderer(this: Renderer, token: any) {
            // This will be handled by the React renderer, but a placeholder is good practice.
            return `<sup>[${token.citationId}]</sup>`;
        },
    };
} 