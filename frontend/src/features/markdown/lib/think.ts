import type {Renderer} from 'marked';

const thinkStart = /<thinking[^>]*>/;
const thinkEnd = /<\/thinking>/;

export function thinkExtension() {
    return {
        name: 'thinkBlock',
        level: 'block' as const,
        start(src: string) {
            return src.match(thinkStart)?.index;
        },
        tokenizer(src: string): any {
            const startMatch = src.match(thinkStart);
            if (!startMatch) {
                return;
            }

            const endMatch = src.match(thinkEnd);
            // handles incomplete blocks for streaming
            if (!endMatch) {
                const raw = src.substring(startMatch.index!);
                const text = raw.replace(thinkStart, '');
                return {
                    type: 'thinkBlock',
                    raw,
                    text,
                    isComplete: false,
                    tokens: [],
                };
            }

            const raw = src.substring(startMatch.index!, endMatch.index! + endMatch[0].length);
            const text = raw.replace(thinkStart, '').replace(thinkEnd, '');

            return {
                type: 'thinkBlock',
                raw,
                text,
                isComplete: true,
                tokens: [],
            };
        },
        renderer(this: Renderer, token: any) {
            // This will be handled by the React renderer, but a placeholder is good practice.
            return `<div class="think-block">${token.text}</div>`;
        },
    };
} 