import React from 'react';
import { Pin, MessageSquare, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePinnedConversations } from '../api/get-pinned-conversations';
import { formatDate } from '@/utils/format';

export const PinnedConversationsSection: React.FC = () => {
  const { data: pinnedConversations, isLoading, error } = usePinnedConversations();

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pin className="size-5 text-blue-500" />
            Pinned Conversations
          </CardTitle>
          <CardDescription>Your important conversations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Failed to load pinned conversations
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pin className="size-5 text-blue-500" />
          Pinned Conversations
        </CardTitle>
        <CardDescription>Your important conversations</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : pinnedConversations?.length ? (
          <div className="space-y-4">
            {pinnedConversations.slice(0, 5).map((conversation) => (
              <div key={conversation.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1 mb-1">
                      {conversation.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {formatDate(conversation.created_at)}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {conversation.provider}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0">
                    <MessageSquare className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
            {pinnedConversations.length > 5 && (
              <Button variant="outline" className="w-full">
                View all {pinnedConversations.length} pinned conversations
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Pin className="size-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No pinned conversations</p>
            <p className="text-sm">Pin important conversations to see them here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
