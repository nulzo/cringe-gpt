const blockKatex = {
    name: 'blockKatex',
    level: 'block',
    start(src: string) {
        return src.indexOf('\n$$');
    },
    tokenizer(src: string) {
        const match = src.match(/^\$\$\n([^$]+?)\n\$\$/);
        if (match) {
            return {
                type: 'blockKatex',
                raw: match[0],
                text: match[1].trim(),
                tokens: [],
            };
        }
    },
    renderer(token: any) {
        return `<KatexRenderer content="${encodeURIComponent(token.text)}" displayMode="true" />`;
    },
};

const inlineKatex = {
    name: 'inlineKatex',
    level: 'inline',
    start(src: string) {
        return src.indexOf('$');
    },
    tokenizer(src: string) {
        const match = src.match(/^\$([^$]+?)\$/);
        if (match) {
            return {
                type: 'inlineKatex',
                raw: match[0],
                text: match[1].trim(),
            };
        }
    },
    renderer(token: any) {
        return `<KatexRenderer content="${encodeURIComponent(token.text)}" displayMode="false" />`;
    },
};

export const katexExtension = () => {
    return {
        extensions: [blockKatex, inlineKatex],
    };
}; 