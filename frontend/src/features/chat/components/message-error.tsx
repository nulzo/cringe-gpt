import {FrownIcon} from 'lucide-react';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import type {Message} from '../types';

interface MessageErrorProps {
    message: Message;
}

export const MessageError = ({message}: MessageErrorProps) => {
    return (
        <div className="flex gap-3 w-full max-w-[95%]">
            <div className="flex flex-col items-center mb-0">
                <TooltipProvider>
                    <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                            <div
                                className="relative flex justify-center items-center bg-destructive rounded-lg w-10 h-10">
                                <FrownIcon strokeWidth="2" className="m-2 size-6 text-destructive-foreground"/>
                                <div
                                    className="-right-0.5 -bottom-0.5 absolute bg-destructive rounded-full ring-2 ring-background size-2.5"/>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">
                            Status Code: {message.error?.error_code || 'Unknown'}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <div className="flex flex-col w-full">
                <div className="flex items-baseline gap-1.5 mb-0.5 ml-1">
          <span className="font-medium text-destructive text-sm">
            {message.name || message.model || 'Assistant'}
          </span>
                </div>

                <div className="bg-destructive/10 mb-4 px-4 py-3 border border-destructive rounded-xl">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 font-semibold text-destructive">
                            {message.error?.error_title || 'Error'}
                        </div>
                    </div>
                    <p className="mt-4 text-destructive text-sm">
                        {message.error?.error_description || 'An unexpected error occurred'}
                    </p>
                </div>
            </div>
        </div>
    );
}; 