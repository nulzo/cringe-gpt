export interface MetricsSummary {
  totalRequests: number;
  totalCost: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  averageDurationMs: number;
  averageCostPerRequest: number;
  averageTokensPerRequest: number;
}

export interface MetricsByModel {
  model: string;
  provider: string;
  summary: MetricsSummary;
  usagePercentage: number;
  uniqueConversations: number;
  averageCostPerToken: number;
}

export interface MetricsByProvider {
  provider: string;
  summary: MetricsSummary;
  usagePercentage: number;
  modelCount: number;
  quotaLimit?: number;
  quotaUsed?: number;
  quotaUsagePercentage: number;
}

export interface TimeSeriesMetrics {
  date: string;
  requests: number;
  cost: number;
  promptTokens: number;
  completionTokens: number;
  averageDurationMs: number;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  successRate: number;
  totalErrors: number;
  totalRequests: number;
  tokensPerSecond: number;
}

export interface CostBreakdown {
  totalCost: number;
  promptCost: number;
  completionCost: number;
  averageCostPerRequest: number;
  averageCostPerToken: number;
  mostExpensiveModel?: string;
  mostExpensiveProvider?: string;
}

export interface UsageHabits {
  peakHour: number;
  mostActiveDay?: string;
  averageSessionLength: number;
  averageRequestsPerSession: number;
  mostUsedModel?: string;
  mostUsedProvider?: string;
}

export interface AnalyticsDashboard {
  overall: MetricsSummary;
  byProvider: MetricsByProvider[];
  byModel: MetricsByModel[];
  timeSeries: TimeSeriesMetrics[];
  performance: PerformanceMetrics;
  costBreakdown: CostBreakdown;
  usageHabits: UsageHabits;
  generatedAt: string;
}

// API Request/Response types
export interface AnalyticsQueryParams {
  from?: string;
  to?: string;
  groupBy?: 'hour' | 'day' | 'month';
  limit?: number;
  days?: number;
}

// Chart data types for Recharts
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface TimeSeriesChartData {
  date: string;
  requests: number;
  cost: number;
  tokens: number;
  duration: number;
  [key: string]: any;
}

export interface ProviderChartData {
  provider: string;
  requests: number;
  cost: number;
  tokens: number;
  percentage: number;
  [key: string]: any;
}

export interface ModelChartData {
  model: string;
  provider: string;
  requests: number;
  cost: number;
  tokens: number;
  percentage: number;
  [key: string]: any;
}

// Dashboard state types
export interface AnalyticsTimeRange {
  from?: Date;
  to?: Date;
  preset?: '7d' | '30d' | '90d' | '1y' | 'all';
}

export interface AnalyticsFilters {
  timeRange: AnalyticsTimeRange;
  providers?: string[];
  models?: string[];
  groupBy: 'hour' | 'day' | 'month';
}

// Trend analysis types
export interface TrendData {
  [date: string]: number;
}

// Export types
export interface ExportFormat {
  format: 'csv' | 'json' | 'pdf';
  data: any;
  filename: string;
}

// Error types
export interface AnalyticsError {
  message: string;
  code?: string;
  details?: any;
}

// Conversation Analytics Types
export interface ConversationCompletionMetrics {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  completionRate: number;
  isCompleted: boolean;
  completionReason?: string;
  averageMessagesPerExchange: number;
}

export interface ConversationEngagementMetrics {
  duration: string; // ISO 8601 duration or formatted string
  messageFrequency: number; // Messages per minute
  averageResponseTime: string; // ISO 8601 duration or formatted string
  peakActivityHour: number;
  sessionLengthScore: number; // 0-1 score based on engagement
}

export interface ConversationQualityMetrics {
  averageMessageLength: number;
  totalTokensUsed: number;
  hasErrors: boolean;
  errorCount: number;
  errorRate: number;
  hasImages: boolean;
  hasToolCalls: boolean;
  hasCitations: boolean;
}

export interface ConversationCostMetrics {
  totalCost: number;
  averageCostPerMessage: number;
  costPerToken: number;
  totalTokens: number;
  mostExpensiveModel?: string;
}

export interface ConversationAnalytics {
  conversationId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  provider: string;
  completionMetrics: ConversationCompletionMetrics;
  engagementMetrics: ConversationEngagementMetrics;
  qualityMetrics: ConversationQualityMetrics;
  costMetrics: ConversationCostMetrics;
}

export interface ConversationAnalyticsSummary {
  totalConversations: number;
  averageCompletionRate: number;
  averageConversationDuration: string; // ISO 8601 duration
  averageMessagesPerConversation: number;
  totalCostAcrossAllConversations: number;
  averageEngagementScore: number;
  conversationsWithErrors: number;
  errorRate: number;
  conversationsWithImages: number;
  conversationsWithToolCalls: number;
  conversationsByProvider: Record<string, number>;
  conversationsByDayOfWeek: Record<string, number>;
  conversationsByHour: Record<string, number>;
}

export interface ConversationPattern {
  patternType: string; // "long_conversation", "error_prone", "high_cost", etc.
  conversationCount: number;
  averageDuration: number;
  averageCost: number;
  averageMessages: number;
  conversationIds: number[];
}

export interface ConversationInsights {
  patterns: ConversationPattern[];
  topConversations: ConversationAnalytics[];
  recentConversations: ConversationAnalytics[];
  summary: ConversationAnalyticsSummary;
  generatedAt: string;
}

// Enhanced types for UI components
export interface ConversationChartData {
  date: string;
  conversations: number;
  averageDuration: number;
  totalCost: number;
  completionRate: number;
  [key: string]: any;
}

export interface ConversationMetricsCardData {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
  color?: string;
}

export interface ConversationPatternData {
  pattern: string;
  count: number;
  percentage: number;
  avgCost: number;
  avgMessages: number;
  color: string;
}
