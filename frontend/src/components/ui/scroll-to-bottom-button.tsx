import {Button} from '@/components/ui/button';
import {IconArrowDown} from '@tabler/icons-react';
import { useEffect, useState } from 'react';

interface ScrollToBottomButtonProps {
    onClick: () => void;
    isVisible: boolean;
    className?: string;
}

export const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({
                                                                              onClick,
                                                                              isVisible,
                                                                              className = "",
                                                                          }) => {
    const [shouldPulse, setShouldPulse] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setShouldPulse(true);
            const timer = setTimeout(() => setShouldPulse(false), 600);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    return (
        <div
            className={`
                transition-all duration-400 ease-out
                ${isVisible
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-90 translate-y-3 pointer-events-none'
                }
                ${className}
            `}
        >
            <Button
                onClick={onClick}
                variant="secondary"
                size="sm"
                className="
                    relative overflow-hidden
                    rounded-full
                    transition-all duration-300 ease-out
                    flex items-center justify-center
                    p-2.5
                    hover:bg-secondary/90 active:bg-secondary
                    hover:scale-110 active:scale-95
                    shadow-lg hover:shadow-xl
                    backdrop-blur-sm bg-secondary/80
                    border border-border/50
                    hover:border-border/80
                    before:absolute before:inset-0 before:rounded-full
                    before:bg-gradient-to-r before:from-primary/10 before:to-primary/5
                    before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
                    ${shouldPulse ? 'animate-pulse' : ''}
                "
                aria-label="Scroll to bottom of conversation"
            >

                {/* Content */}
                <div className="relative flex items-center">

                    <div className={`
                        transition-all duration-300 ease-out
                        ${isVisible ? 'rotate-0 scale-100' : 'rotate-12 scale-90'}
                        ${isVisible ? 'animate-in slide-in-from-bottom-2 fade-in duration-300' : ''}
                    `}>
                        <IconArrowDown
                            className={`
                                size-5 text-foreground/80 group-hover:text-foreground
                                transition-all duration-300 ease-out
                                ${isVisible ? 'group-hover:translate-y-[-1px]' : ''}
                            `}
                        />
                    </div>
                </div>
            </Button>
        </div>
    );
}; 