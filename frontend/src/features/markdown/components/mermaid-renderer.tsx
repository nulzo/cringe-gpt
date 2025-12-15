import type { FC } from "react";
import { useMermaid } from "../hooks/use-mermaid";
import { Skeleton } from "@/components/ui/skeleton";

interface MermaidRendererProps {
  code: string;
}

const MermaidRenderer: FC<MermaidRendererProps> = ({ code }) => {
  const { svg, loading, error } = useMermaid(code);

  if (loading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (error) {
    return (
      <div className="text-red-500 text-xs">
        <p>Error rendering Mermaid diagram:</p>
        <pre className="mt-2">{error}</pre>
      </div>
    );
  }

  return svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : null;
};

export default MermaidRenderer;
