import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import { useMemo } from "react";
import { katexExtension } from "../lib/katex";
import { thinkExtension } from "../lib/think";
import { citationExtension } from "../lib/citation";

const markedInstance = new Marked(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const result = lang
        ? hljs.highlight(code, { language: lang }).value
        : hljs.highlightAuto(code).value;
      return result;
    },
  }),
);

markedInstance.setOptions({
  breaks: true,
  gfm: true,
});

// Marked extensions may have type incompatibilities depending on Marked version; cast to any for compatibility.
markedInstance.use(katexExtension() as any);
markedInstance.use(thinkExtension() as any);
markedInstance.use(citationExtension() as any);

export function useTokens(markdown: string) {
  return useMemo(() => {
    return markedInstance.lexer(markdown);
  }, [markdown]);
}
