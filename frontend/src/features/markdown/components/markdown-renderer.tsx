import type { FC } from "react";
import { memo } from "react";
import { useTokens } from "@/features/markdown/hooks/use-tokens";
import CodeBlock from "./code-block";
import KatexRenderer from "./katex-renderer";
// import { ImageDisplay } from "@/features/chat/components/image-display";
import he from "he";
import DOMPurify from "dompurify";

interface MarkdownRendererProps {
  markdown: string;
}

const renderTokens = (tokens: any[]): React.ReactNode[] => {
  return tokens.map((token: any, index: number) => {
    switch (token.type) {
      case "paragraph":
        const innerTokens = token.tokens;
        // If a paragraph only contains a single image, don't wrap it in a <p> tag.
        if (
          innerTokens &&
          innerTokens.length === 1 &&
          innerTokens[0].type === "image"
        ) {
          return renderTokens(innerTokens);
        }
        return (
          <p key={index} className="mb-4">
            {renderTokens(token.tokens)}
          </p>
        );
      case "heading":
        const depth = token.depth as 1 | 2 | 3 | 4 | 5 | 6;
        const Tag = `h${depth}` as const;
        return <Tag key={index}>{renderTokens(token.tokens)}</Tag>;
      case "code":
        return (
          <CodeBlock
            key={index}
            code={he.decode(token.text)}
            lang={token.lang}
          />
        );
      case "list":
        const ListTag = token.ordered ? "ol" : "ul";
        const listStyle = token.ordered ? "list-decimal" : "list-disc";
        return (
          <ListTag key={index} className={`pl-8 my-4 ${listStyle}`}>
            {token.items.map((item: any, i: number) => (
              <li key={i} className="mb-2">
                {renderTokens(item.tokens)}
              </li>
            ))}
          </ListTag>
        );
      case "blockquote":
        return (
          <blockquote key={index} className="pl-4 border-l-4 my-4 italic">
            {renderTokens(token.tokens)}
          </blockquote>
        );
      case "hr":
        return <hr key={index} className="my-8" />;
      case "html":
        return (
          <div
            key={index}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(token.text) }}
          />
        );
      case "image":
        const fileIdMatch = token.href?.match(/\/api\/v1\/files\/(\d+)/);
        const fileId = fileIdMatch ? fileIdMatch[1] : undefined;

        if (fileId) {
          return (
            <div key={index} className="my-4 max-w-md">
              {/* <ImageDisplay
                fileId={fileId}
                altText={token.text}
                className="max-w-md"
              /> */}
            </div>
          );
        } else {
          // Fallback for regular, external images
          return (
            <img
              key={index}
              src={token.href}
              alt={token.text}
              title={token.title}
              className="max-w-full h-auto rounded-lg my-4"
            />
          );
        }
      case "strong":
        return <strong key={index}>{renderTokens(token.tokens)}</strong>;
      case "em":
        return <em key={index}>{renderTokens(token.tokens)}</em>;
      case "del":
        return <del key={index}>{renderTokens(token.tokens)}</del>;
      case "table":
        return (
          <div className="shadow-xs rounded-xl overflow-x-auto">
            <table className="rounded-xl w-full min-w-5xl overflow-hidden table-auto">
              <thead className="">
                <tr className="m-0 p-0 whitespace-nowrap">
                  {token.header.map((header: any, headerIdx: number) => (
                    <th
                      key={`header-${headerIdx}`}
                      style={{ textAlign: token.align[headerIdx] || "" }}
                      className="px-3 py-2 font-semibold [&[align=center]]:text-center [&[align=right]]:text-right text-nowrap whitespace-break-spaces"
                    >
                      {renderTokens(header.tokens)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {token.rows.map((row: any, rowIdx: number) => (
                  <tr key={`row-${rowIdx}`} className="m-0 p-0">
                    {(row ?? []).map((cell: any, cellIdx: number) => (
                      <td
                        key={`cell-${rowIdx}-${cellIdx}`}
                        style={{ textAlign: token.align[cellIdx] || "" }}
                        className="px-4 py-2 [&[align=center]]:text-center [&[align=right]]:text-right text-nowrap whitespace-break-spaces"
                      >
                        {renderTokens(cell.tokens)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "codespan":
        return (
          <code
            key={index}
            className="bg-muted px-1 py-0.5 rounded text-sm font-mono"
          >
            {he.decode(token.text)}
          </code>
        );
      case "link":
        return (
          <a
            href={token.href}
            title={token.title}
            key={index}
            className="text-primary hover:underline"
          >
            {renderTokens(token.tokens)}
          </a>
        );
      case "text":
        return token.tokens ? (
          <span key={index}>{renderTokens(token.tokens)}</span>
        ) : (
          <span key={index}>{he.decode(token.text)}</span>
        );
      case "space":
        return null;
      case "br":
        return <br key={index} />;

      // Custom extensions
      case "blockKatex":
        return (
          <KatexRenderer key={index} content={token.text} displayMode={true} />
        );
      case "inlineKatex":
        return (
          <KatexRenderer key={index} content={token.text} displayMode={false} />
        );

      // TODO: Implement these components
      case "thinkBlock":
        return (
          <div
            key={index}
            className="p-4 my-4 border border-dashed rounded-md bg-muted/50"
          >
            In progress...
          </div>
        );
      case "inlineCitation":
        return (
          <sup key={index} className="text-primary font-bold">
            [{token.citationId}]
          </sup>
        );

      default:
        console.warn(`Unhandled token type: ${token.type}`);
        return null;
    }
  });
};

const MarkdownRenderer: FC<MarkdownRendererProps> = memo(({ markdown }) => {
  const tokens = useTokens(markdown);

  return (
    <div className="markdown max-w-full break-words overflow-hidden [&_pre]:overflow-x-auto [&_pre>code]:whitespace-pre [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto">
      {renderTokens(tokens)}
    </div>
  );
});

export default MarkdownRenderer;
