import React from 'react';
import { LayoutDashboard, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LikedMessagesSection } from './liked-messages-section';
import { PinnedConversationsSection } from './pinned-conversations-section';
import { RecentConversationsSection } from './recent-conversations-section';
import { OverviewStats } from './overview-stats';

export const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                <LayoutDashboard className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Overview of your conversations and activity</p>
              </div>
            </div>
            <Button className="gap-2">
              <Sparkles className="size-4" />
              New Conversation
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Overview Stats */}
        <div className="mb-8">
          <OverviewStats />
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Left Column - Full Height */}
          <div className="lg:col-span-2 space-y-6">
            {/* Liked Messages */}
            <LikedMessagesSection />

            {/* Recent Conversations */}
            <RecentConversationsSection />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Pinned Conversations */}
            <PinnedConversationsSection />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Sparkles className="size-4" />
                  New Conversation
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <LayoutDashboard className="size-4" />
                  View Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Sparkles className="size-4" />
                  Browse Prompts
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
