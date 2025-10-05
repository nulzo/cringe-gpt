import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useChatStore } from '../stores/chat-store';
import { useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

interface NavigationErrorFallbackProps {
  conversationId: string | null;
  error: Error | string;
  onRetry: () => void;
}

/**
 * Component that provides a fallback UI when navigation to a conversation fails
 * Offers options to retry, view the conversation in place, or start a new conversation
 */
export function NavigationErrorFallback({
  conversationId,
  error,
  onRetry
}: NavigationErrorFallbackProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeConversationId, streamingConversationId } = useChatStore();
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);

  // Determine if we're dealing with a streaming conversation
  const isStreamingConversation = streamingConversationId === conversationId;

  // Format the error message for display
  const errorMessage = typeof error === 'string' ? error : error.message;

  // Handle retry with exponential backoff
  const handleRetry = () => {
    setIsRecovering(true);
    setRecoveryAttempts(prev => prev + 1);

    // Exponential backoff: 1s, 2s, 4s, etc.
    const delay = Math.min(1000 * Math.pow(2, recoveryAttempts), 8000);

    setTimeout(() => {
      // Invalidate queries to force fresh data
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] });

      // Call the retry callback
      onRetry();
      setIsRecovering(false);
    }, delay);
  };

  // Handle viewing the conversation in place (without navigation)
  const handleViewInPlace = () => {
    if (conversationId) {
      // Force a refetch of the conversation data
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });

      // Set the active conversation ID without navigation
      useChatStore.getState().setActiveConversationId(conversationId);
    }
  };

  // Handle starting a new conversation
  const handleNewConversation = () => {
    navigate('/chat');
  };

  // Auto-retry once on mount
  useEffect(() => {
    if (recoveryAttempts === 0) {
      handleRetry();
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6 text-center">
      <div className="space-y-2">
        <h3 className="text-xl font-medium">Navigation Error</h3>
        <p className="text-muted-foreground">
          {isStreamingConversation
            ? "We're having trouble navigating while your response is streaming."
            : "We're having trouble navigating to this conversation."}
        </p>
        <p className="text-sm text-destructive">{errorMessage}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={handleRetry}
          disabled={isRecovering}
        >
          {isRecovering ? (
            <>
              <Skeleton className="h-4 w-4 mr-2 rounded-full animate-spin" />
              Retrying...
            </>
          ) : (
            `Retry (${recoveryAttempts})`
          )}
        </Button>

        {conversationId && (
          <Button
            variant="secondary"
            onClick={handleViewInPlace}
          >
            View Conversation
          </Button>
        )}

        <Button
          variant="default"
          onClick={handleNewConversation}
        >
          New Conversation
        </Button>
      </div>

      {isStreamingConversation && (
        <div className="text-sm text-muted-foreground mt-4 max-w-md">
          <p>Your response is still streaming. You can:</p>
          <ul className="list-disc list-inside mt-2 text-left">
            <li>Wait for streaming to complete</li>
            <li>View the conversation without changing pages</li>
            <li>Start a new conversation</li>
          </ul>
        </div>
      )}
    </div>
  );
}