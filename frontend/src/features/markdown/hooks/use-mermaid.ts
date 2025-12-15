import { useEffect, useState } from "react";
import mermaid from "mermaid";
import { v4 as uuidv4 } from "uuid";
import he from "he";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  suppressErrorRendering: true,
});

export const useMermaid = (code: string) => {
  const [svg, setSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderMermaid = async () => {
      setLoading(true);
      try {
        const decodedCode = he.decode(code);
        const { svg } = await mermaid.render(
          `mermaid-${uuidv4()}`,
          decodedCode,
        );
        setSvg(svg);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      renderMermaid();
    }
  }, [code]);

  return { svg, loading, error };
};
