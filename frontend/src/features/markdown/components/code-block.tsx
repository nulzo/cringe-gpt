import type { FC } from "react";
import { useClipboard } from "@/hooks/use-clipboard";
import CodeCopyButton from "./copy-button";
import hljs from "highlight.js";
import MermaidRenderer from "./mermaid-renderer";

interface CodeBlockProps {
  code: string;
  lang?: string;
}

const CodeBlock: FC<CodeBlockProps> = ({ code, lang }) => {
  const { copy, copied } = useClipboard();
  const isMermaid = lang === "mermaid";

  const handleCopy = () => {
    copy(code);
  };

  const highlightedCode = hljs.getLanguage(lang || "")
    ? hljs.highlight(code, { language: lang || "plaintext" }).value
    : hljs.highlightAuto(code).value;

  return (
    <div className="hljs relative my-4 rounded-lg overflow-hidden text-sm">
      <div className="flex justify-between items-center px-4 pt-2">
        <span className="pl-3 text-muted-foreground text-xs">
          {lang || "plaintext"}
        </span>
        <CodeCopyButton onClick={handleCopy} copied={copied} />
      </div>
      <pre className="px-4 pb-4 overflow-x-auto">
        {isMermaid ? (
          <MermaidRenderer code={code} />
        ) : (
          <code
            className={`hljs language-${lang || "plaintext"} rounded-lg`}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        )}
      </pre>
    </div>
  );
};

export default CodeBlock;
