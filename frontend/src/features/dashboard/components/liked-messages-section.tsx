import React from 'react';
import { Heart, MessageSquare, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLikedMessages } from '../api/get-liked-messages';
import { formatDate } from '@/utils/format';

export const LikedMessagesSection: React.FC = () => {
  const { data: likedMessagesResponse, isLoading, error } = useLikedMessages(1, 10);

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="size-5 text-red-500" />
            Liked Messages
          </CardTitle>
          <CardDescription>Messages you've liked for later reference</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Failed to load liked messages
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="size-5 text-red-500" />
          Liked Messages
        </CardTitle>
        <CardDescription>Messages you've liked for later reference</CardDescription>
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
        ) : likedMessagesResponse?.data?.length ? (
          <div className="space-y-4">
            {likedMessagesResponse.data.slice(0, 5).map((message) => (
              <div key={message.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {message.role}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {formatDate(message.createdAt || message.created_at)}
                      </div>
                    </div>
                    <p className="text-sm line-clamp-2 text-muted-foreground">
                      {message.content}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0">
                    <MessageSquare className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
            {likedMessagesResponse.data.length > 5 && (
              <Button variant="outline" className="w-full">
                View all {likedMessagesResponse.data.length} liked messages
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="size-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No liked messages yet</p>
            <p className="text-sm">Like messages to see them here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
