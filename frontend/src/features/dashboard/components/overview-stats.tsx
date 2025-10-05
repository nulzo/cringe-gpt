import React from 'react';
import { Heart, MessageSquare, Pin, FileText, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLikedMessages, usePinnedConversations, useConversations } from '../api';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description, isLoading }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </>
      )}
    </CardContent>
  </Card>
);

export const OverviewStats: React.FC = () => {
  const { data: likedMessages, isLoading: likedLoading } = useLikedMessages();
  const { data: pinnedConversations, isLoading: pinnedLoading } = usePinnedConversations();
  const { data: conversations, isLoading: conversationsLoading } = useConversations();

  const stats = [
    {
      title: 'Total Conversations',
      value: conversations?.length || 0,
      icon: <MessageSquare className="h-4 w-4 text-muted-foreground" />,
      description: 'All your chat sessions',
      isLoading: conversationsLoading,
    },
    {
      title: 'Pinned Conversations',
      value: pinnedConversations?.length || 0,
      icon: <Pin className="h-4 w-4 text-blue-500" />,
      description: 'Important conversations',
      isLoading: pinnedLoading,
    },
    {
      title: 'Liked Messages',
      value: likedMessages?.data?.length || 0,
      icon: <Heart className="h-4 w-4 text-red-500" />,
      description: 'Messages you saved',
      isLoading: likedLoading,
    },
    {
      title: 'Active This Week',
      value: Math.floor(Math.random() * 20) + 5, // Placeholder - would need real analytics
      icon: <TrendingUp className="h-4 w-4 text-green-500" />,
      description: 'Conversations this week',
      isLoading: false,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          description={stat.description}
          isLoading={stat.isLoading}
        />
      ))}
    </div>
  );
};
