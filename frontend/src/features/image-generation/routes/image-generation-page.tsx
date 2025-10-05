'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {useGenerateImage} from '../api/generate-image';
import {type ImageDto, type ImageGenerationRequestDto} from '../api/types';
import useNotificationStore from '@/stores/notification-store';
import {useChatConfigStore} from '@/stores/chat-config-store';

const ImageGenerationPage = () => {
    const [prompt, setPrompt] = useState<string>('');
    const {selectedModelId, selectedProvider} = useChatConfigStore();
    const addNotification = useNotificationStore((s) => s.addNotification);

    const {
        mutate: generateImage,
        data: imageResponse,
        isPending,
    } = useGenerateImage({
        onSuccess: () => {
            addNotification({
                type: 'success',
                title: 'Success',
                message: 'Images generated successfully',
            });
        },
        onError: (error) => {
            addNotification({
                type: 'error',
                title: 'Error',
                message: `Image generation failed: ${(error as Error).message}`,
            });
        },
    });

    const handleGenerate = () => {
        if (!prompt.trim()) {
            addNotification({
                type: 'error',
                title: 'Validation Error',
                message: 'Prompt cannot be empty',
            });
            return;
        }

        if (!selectedProvider || !selectedModelId) {
            addNotification({
                type: 'error',
                title: 'Validation Error',
                message: 'A provider and model must be selected',
            });
            return;
        }

        const request: ImageGenerationRequestDto = {
            prompt,
            provider: selectedProvider,
            model: selectedModelId,
            n: 1,
            quality: 'standard',
            size: '1024x1024',
            style: 'vivid',
        };
        generateImage(request);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto p-4 md:p-6">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold mb-4">Image Generation</h1>
                    <div className="grid gap-4">
                        {isPending && (
                            <div className="flex items-center justify-center">
                                <p>Generating images...</p>
                            </div>
                        )}
                        {imageResponse && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {imageResponse.images.map((image: ImageDto) => (
                                    <div key={image.id} className="rounded-lg overflow-hidden">
                                        <img
                                            src={image.url}
                                            alt={image.prompt}
                                            className="w-full h-auto object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="p-4 md:p-6 border-t">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col gap-4">
                        <Textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Enter a prompt to generate an image..."
                            className="min-h-[80px]"
                        />
                        <Button onClick={handleGenerate} disabled={isPending}>
                            {isPending ? 'Generating...' : 'Generate'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageGenerationPage; 