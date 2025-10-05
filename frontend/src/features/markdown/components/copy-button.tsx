import {IconCheck, IconCopy} from '@tabler/icons-react';
import type {FC} from 'react';

interface CodeCopyButtonProps {
    onClick: () => void;
    copied: boolean;
}

const CodeCopyButton: FC<CodeCopyButtonProps> = ({onClick, copied}) => {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Copy to clipboard"
        >
            {copied ? (
                <IconCheck className="size-4"/>
            ) : (
                <IconCopy className="size-4"/>
            )}
            {copied ? 'Copied' : 'Copy'}
        </button>
    );
};

export default CodeCopyButton; 