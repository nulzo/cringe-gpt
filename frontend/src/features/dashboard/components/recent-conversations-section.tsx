import React from 'react';
import { MessageSquare, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useConversations } from '../api';
import { formatDate } from '@/utils/format';

export const RecentConversationsSection: React.FC = () => {
  const { data: conversations, isLoading, error } = useConversations();

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="size-5 text-green-500" />
            Recent Conversations
          </CardTitle>
          <CardDescription>Your latest chat sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Failed to load conversations
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="size-5 text-green-500" />
          Recent Conversations
        </CardTitle>
        <CardDescription>Your latest chat sessions</CardDescription>
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
        ) : conversations?.length ? (
          <div className="space-y-4">
            {conversations.slice(0, 5).map((conversation) => (
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
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
            {conversations.length > 5 && (
              <Button variant="outline" className="w-full">
                View all {conversations.length} conversations
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="size-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No conversations yet</p>
            <p className="text-sm">Start a new conversation to see it here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
