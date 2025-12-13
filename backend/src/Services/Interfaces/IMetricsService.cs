using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Models;

namespace OllamaWebuiBackend.Services.Interfaces;

public interface IMetricsService
{
    Task<UsageMetric> RecordUsageAsync(AppUser user, Conversation conversation, Message assistantMessage, string model,
        int promptTokens, int completionTokens, int durationMs, decimal? actualCost = null,
        int imageInputTokens = 0, int imageOutputTokens = 0);

    Task<IEnumerable<UsageMetric>> GetAllAsync();
    Task<MetricsSummaryDto> GetSummaryAsync(int userId, DateTime? from = null, DateTime? to = null);
    Task<IEnumerable<MetricsByModelDto>> GetSummaryByModelAsync(int userId, DateTime? from = null, DateTime? to = null);
    Task<IEnumerable<MetricsByProviderDto>> GetSummaryByProviderAsync(int userId, DateTime? from = null, DateTime? to = null);

    // Advanced Analytics Methods
    Task<AnalyticsDashboardDto> GetDashboardAnalyticsAsync(int userId, DateTime? from = null, DateTime? to = null, string groupBy = "day");
    Task<IEnumerable<TimeSeriesMetricsDto>> GetTimeSeriesMetricsAsync(int userId, DateTime? from = null, DateTime? to = null, string groupBy = "day");
    Task<PerformanceMetricsDto> GetPerformanceMetricsAsync(int userId, DateTime? from = null, DateTime? to = null);
    Task<CostBreakdownDto> GetCostBreakdownAsync(int userId, DateTime? from = null, DateTime? to = null);
    Task<UsageHabitsDto> GetUsageHabitsAsync(int userId, DateTime? from = null, DateTime? to = null);
    Task<IEnumerable<MetricsByModelDto>> GetTopModelsAsync(int userId, int limit = 10, DateTime? from = null, DateTime? to = null);
    Task<IEnumerable<MetricsByProviderDto>> GetProviderUsageAsync(int userId, DateTime? from = null, DateTime? to = null);

    // Trend Analysis
    Task<Dictionary<string, double>> GetCostTrendsAsync(int userId, DateTime? from = null, DateTime? to = null, string groupBy = "day");
    Task<Dictionary<string, double>> GetUsageTrendsAsync(int userId, DateTime? from = null, DateTime? to = null, string groupBy = "day");
    Task<Dictionary<string, double>> GetPerformanceTrendsAsync(int userId, DateTime? from = null, DateTime? to = null, string groupBy = "day");

    // Conversation Analytics
    Task<IEnumerable<ConversationAnalyticsDto>> GetConversationAnalyticsAsync(int userId, DateTime? from = null, DateTime? to = null);
    Task<ConversationAnalyticsSummaryDto> GetConversationAnalyticsSummaryAsync(int userId, DateTime? from = null, DateTime? to = null);
    Task<IEnumerable<ConversationPatternDto>> GetConversationPatternsAsync(int userId, DateTime? from = null, DateTime? to = null);
    Task<ConversationInsightsDto> GetConversationInsightsAsync(int userId, int topCount = 10, DateTime? from = null, DateTime? to = null);
    Task<ConversationAnalyticsDto?> GetConversationAnalyticsByIdAsync(int conversationId, int userId);
}