import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import { katexExtension } from './katex';
import { thinkExtension } from './think';
import { citationExtension } from './citation';

export const markedInstance = new Marked(
    markedHighlight({
        langPrefix: 'hljs language-',
        highlight(code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(code, { language: lang }).value;
                } catch (e) {
                    console.error(e);
                }
            }
            try {
                return hljs.highlightAuto(code).value;
            } catch (e) {
                console.error(e);
            }
            return code;
        },
    })
);

markedInstance.use({
    breaks: true,
    gfm: true,
});

markedInstance.use(katexExtension());
markedInstance.use(thinkExtension());
markedInstance.use(citationExtension());
