import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAnalyticsActiveTab, useSetActiveTab } from "@/stores/analytics-store"
import Controls from "../../features/analytics/components/controls"
import OverviewSection from "../../features/analytics/components/overview-section"
import CostsSection from "../../features/analytics/components/costs-section"
import UsageSection from "../../features/analytics/components/usage-section"
import PerformanceSection from "../../features/analytics/components/performance-section"
import ModelsSection from "../../features/analytics/components/models-section"
import ProvidersSection from "../../features/analytics/components/providers-section"
import ConversationSection from "../../features/analytics/components/conversation-section"
import ConversationInsights from "../../features/analytics/components/conversation-insights"

export const Analytics = () => {
    const activeTab = useAnalyticsActiveTab()
    const setActiveTab = useSetActiveTab()

    return (
        <section className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
                <Controls />
            </header>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="costs">Costs</TabsTrigger>
                    <TabsTrigger value="usage">Usage</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="models">Models</TabsTrigger>
                    <TabsTrigger value="providers">Providers</TabsTrigger>
                    <TabsTrigger value="conversations">Conversations</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <OverviewSection />
                </TabsContent>
                <TabsContent value="costs">
                    <CostsSection />
                </TabsContent>
                <TabsContent value="usage">
                    <UsageSection />
                </TabsContent>
                <TabsContent value="performance">
                    <PerformanceSection />
                </TabsContent>
                <TabsContent value="models">
                    <ModelsSection />
                </TabsContent>
                <TabsContent value="providers">
                    <ProvidersSection />
                </TabsContent>
                <TabsContent value="conversations">
                    <div className="space-y-6">
                        <ConversationSection />
                        <ConversationInsights />
                    </div>
                </TabsContent>
            </Tabs>
        </section>
    )
}