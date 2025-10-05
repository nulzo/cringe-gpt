import type {FC} from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {cn} from '@/lib/utils';

interface KatexRendererProps {
    content: string;
    displayMode?: boolean;
}

const KatexRenderer: FC<KatexRendererProps> = ({content, displayMode = false}) => {
    const decodedContent = decodeURIComponent(content);

    try {
        const html = katex.renderToString(decodedContent, {
            displayMode,
            throwOnError: false,
            errorColor: '#ef4444',
            strict: false,
            trust: true,
            output: 'htmlAndMathml',
        });

        return (
            <span
                className={cn('katex-container', displayMode && 'block text-center my-2')}
                dangerouslySetInnerHTML={{__html: html}}
            />
        );
    } catch (error) {
        console.error('KaTeX rendering error:', error);
        return <span className="text-destructive">{decodedContent}</span>;
    }
};

export default KatexRenderer; 