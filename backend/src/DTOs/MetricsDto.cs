using OllamaWebuiBackend.Enums;

namespace OllamaWebuiBackend.DTOs;

public class MetricsSummaryDto
{
    public long TotalRequests { get; set; }
    public decimal TotalCost { get; set; }
    public long TotalPromptTokens { get; set; }
    public long TotalCompletionTokens { get; set; }
    public long TotalTokens => TotalPromptTokens + TotalCompletionTokens;
    public double AverageDurationMs { get; set; }
    public double AverageCostPerRequest { get; set; }
    public double AverageTokensPerRequest => TotalRequests > 0 ? (double)TotalTokens / TotalRequests : 0;
}

public class MetricsByModelDto
{
    public required string Model { get; set; }
    public required string Provider { get; set; }
    public MetricsSummaryDto Summary { get; set; } = new();
    public double UsagePercentage { get; set; }
    public int UniqueConversations { get; set; }
    public double AverageCostPerToken { get; set; }
}

public class MetricsByProviderDto
{
    public required string Provider { get; set; }
    public MetricsSummaryDto Summary { get; set; } = new();
    public double UsagePercentage { get; set; }
    public int ModelCount { get; set; }
    public decimal? QuotaLimit { get; set; }
    public decimal? QuotaUsed { get; set; }
    public double QuotaUsagePercentage => QuotaLimit.HasValue && QuotaLimit.Value > 0 ? (double)(QuotaUsed ?? 0) / (double)QuotaLimit.Value * 100 : 0;
}

public class TimeSeriesMetricsDto
{
    public required DateTime Date { get; set; }
    public long Requests { get; set; }
    public decimal Cost { get; set; }
    public long PromptTokens { get; set; }
    public long CompletionTokens { get; set; }
    public double AverageDurationMs { get; set; }
}

public class PerformanceMetricsDto
{
    public double AverageResponseTime { get; set; }
    public double MedianResponseTime { get; set; }
    public double P95ResponseTime { get; set; }
    public double SuccessRate { get; set; }
    public long TotalErrors { get; set; }
    public long TotalRequests { get; set; }
    public double TokensPerSecond { get; set; }
}

public class CostBreakdownDto
{
    public decimal TotalCost { get; set; }
    public decimal PromptCost { get; set; }
    public decimal CompletionCost { get; set; }
    public decimal AverageCostPerRequest { get; set; }
    public decimal AverageCostPerToken { get; set; }
    public string? MostExpensiveModel { get; set; }
    public string? MostExpensiveProvider { get; set; }
}

public class UsageHabitsDto
{
    public int PeakHour { get; set; }
    public string? MostActiveDay { get; set; }
    public double AverageSessionLength { get; set; }
    public int AverageRequestsPerSession { get; set; }
    public string? MostUsedModel { get; set; }
    public string? MostUsedProvider { get; set; }
}

public class AnalyticsDashboardDto
{
    public MetricsSummaryDto Overall { get; set; } = new();
    public IEnumerable<MetricsByProviderDto> ByProvider { get; set; } = new List<MetricsByProviderDto>();
    public IEnumerable<MetricsByModelDto> ByModel { get; set; } = new List<MetricsByModelDto>();
    public IEnumerable<TimeSeriesMetricsDto> TimeSeries { get; set; } = new List<TimeSeriesMetricsDto>();
    public PerformanceMetricsDto Performance { get; set; } = new();
    public CostBreakdownDto CostBreakdown { get; set; } = new();
    public UsageHabitsDto UsageHabits { get; set; } = new();
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

// Conversation Analytics DTOs
public class ConversationAnalyticsDto
{
    public int ConversationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public ProviderType Provider { get; set; }
    public ConversationCompletionMetrics CompletionMetrics { get; set; } = new();
    public ConversationEngagementMetrics EngagementMetrics { get; set; } = new();
    public ConversationQualityMetrics QualityMetrics { get; set; } = new();
    public ConversationCostMetrics CostMetrics { get; set; } = new();
}

public class ConversationCompletionMetrics
{
    public int TotalMessages { get; set; }
    public int UserMessages { get; set; }
    public int AssistantMessages { get; set; }
    public double CompletionRate => TotalMessages > 0 ? (double)AssistantMessages / UserMessages : 0;
    public bool IsCompleted { get; set; }
    public string? CompletionReason { get; set; }
    public int AverageMessagesPerExchange => UserMessages > 0 ? TotalMessages / UserMessages : 0;
}

public class ConversationEngagementMetrics
{
    public TimeSpan Duration { get; set; }
    public int MessageFrequency { get; set; } // Messages per minute
    public TimeSpan AverageResponseTime { get; set; }
    public int PeakActivityHour { get; set; }
    public double SessionLengthScore { get; set; } // 0-1 score based on engagement
}

public class ConversationQualityMetrics
{
    public double AverageMessageLength { get; set; }
    public int TotalTokensUsed { get; set; }
    public bool HasErrors { get; set; }
    public int ErrorCount { get; set; }
    public double ErrorRate => 0; // Will be calculated in the service layer
    public bool HasImages { get; set; }
    public bool HasToolCalls { get; set; }
    public bool HasCitations { get; set; }
}

public class ConversationCostMetrics
{
    public decimal TotalCost { get; set; }
    public decimal AverageCostPerMessage { get; set; }
    public decimal CostPerToken { get; set; }
    public int TotalTokens { get; set; }
    public string? MostExpensiveModel { get; set; }
}

public class ConversationAnalyticsSummaryDto
{
    public int TotalConversations { get; set; }
    public double AverageCompletionRate { get; set; }
    public TimeSpan AverageConversationDuration { get; set; }
    public int AverageMessagesPerConversation { get; set; }
    public decimal TotalCostAcrossAllConversations { get; set; }
    public double AverageEngagementScore { get; set; }
    public int ConversationsWithErrors { get; set; }
    public double ErrorRate { get; set; }
    public int ConversationsWithImages { get; set; }
    public int ConversationsWithToolCalls { get; set; }
    public Dictionary<string, int> ConversationsByProvider { get; set; } = new();
    public Dictionary<string, int> ConversationsByDayOfWeek { get; set; } = new();
    public Dictionary<int, int> ConversationsByHour { get; set; } = new();
}

public class ConversationPatternDto
{
    public string PatternType { get; set; } = string.Empty; // "frequent_user", "long_conversation", "error_prone", etc.
    public int ConversationCount { get; set; }
    public double AverageDuration { get; set; }
    public double AverageCost { get; set; }
    public double AverageMessages { get; set; }
    public List<int> ConversationIds { get; set; } = new();
}

public class ConversationInsightsDto
{
    public List<ConversationPatternDto> Patterns { get; set; } = new();
    public List<ConversationAnalyticsDto> TopConversations { get; set; } = new();
    public List<ConversationAnalyticsDto> RecentConversations { get; set; } = new();
    public ConversationAnalyticsSummaryDto Summary { get; set; } = new();
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}
