import {Skeleton} from '@/components/ui/skeleton';
import {BotIcon} from './bot-icon';
import {MessageHeader} from './message-header';
import type {Message} from '../types';

interface MessageLoadingProps {
    message: Message;
}

export const MessageLoading = ({message}: MessageLoadingProps) => {
    return (
        <div className="flex flex-col gap-1 px-4 py-2">
            <div className="flex gap-3 w-full max-w-[85%]">
                <div className="flex flex-col items-center mb-0">
                    <BotIcon
                        isOnline={false}
                        modelName={message.model}
                        modelId={message.model}
                        provider={message.provider}
                    />
                </div>
                <div className="flex flex-col w-full">
                    <MessageHeader
                        message={message}
                        isModelOnline={false}
                        providerName={message.provider}
                    />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full"/>
                        <Skeleton className="h-4 w-3/4"/>
                        <Skeleton className="h-4 w-1/2"/>
                    </div>
                </div>
            </div>
        </div>
    );
}; 