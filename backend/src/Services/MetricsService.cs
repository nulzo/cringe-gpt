using Microsoft.EntityFrameworkCore;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services;

public class MetricsService : IMetricsService
{
    private readonly IMetricsRepository _metricsRepository;
    private readonly IPricingService _pricingService;
    private readonly IConversationService _conversationService;

    public MetricsService(IMetricsRepository metricsRepository, IPricingService pricingService,
        IConversationService conversationService)
    {
        _metricsRepository = metricsRepository;
        _pricingService = pricingService;
        _conversationService = conversationService;
    }

    public async Task<UsageMetric> RecordUsageAsync(AppUser user, Conversation conversation, Message assistantMessage,
        string model, int promptTokens, int completionTokens, int durationMs, decimal? actualCost = null,
        int imageInputTokens = 0, int imageOutputTokens = 0)
    {
        // Use actual cost from provider if available, otherwise calculate
        var cost = actualCost ?? await _pricingService.CalculateCostDynamicAsync(
            user.Id, conversation.Provider.ToString(), model, promptTokens, completionTokens,
            imageInputTokens: imageInputTokens, imageOutputTokens: imageOutputTokens);

        var metric = new UsageMetric
        {
            UserId = user.Id,
            ConversationId = conversation.Id,
            MessageId = assistantMessage.Id,
            Provider = conversation.Provider,
            Model = model,
            PromptTokens = promptTokens,
            CompletionTokens = completionTokens,
            CostInUSD = cost,
            DurationMs = durationMs
        };

        await _metricsRepository.AddAsync(metric);
        await _metricsRepository.SaveChangesAsync();
        return metric;
    }

    public async Task<IEnumerable<UsageMetric>> GetAllAsync()
    {
        return await _metricsRepository.GetAllOrderedByDateAsync();
    }

    public async Task<MetricsSummaryDto> GetSummaryAsync(int userId, DateTime? from = null, DateTime? to = null)
    {
        return await _metricsRepository.GetFiltered(userId, from, to)
            .GroupBy(m => m.UserId)
            .Select(g => new MetricsSummaryDto
            {
                TotalRequests = g.Count(),
                TotalCost = (decimal)g.Sum(m => (double)m.CostInUSD),
                TotalPromptTokens = g.Sum(m => m.PromptTokens),
                TotalCompletionTokens = g.Sum(m => m.CompletionTokens),
                AverageDurationMs = g.Average(m => m.DurationMs)
            })
            .FirstOrDefaultAsync() ?? new MetricsSummaryDto();
    }

    public async Task<IEnumerable<MetricsByModelDto>> GetSummaryByModelAsync(int userId, DateTime? from = null,
        DateTime? to = null)
    {
        var query = _metricsRepository.GetFiltered(userId, from, to);
        var totalRequests = await query.CountAsync();

        return await query
            .GroupBy(m => new { m.Model, m.Provider })
            .Select(g => new MetricsByModelDto
            {
                Model = g.Key.Model,
                Provider = g.Key.Provider.ToString(),
                Summary = new MetricsSummaryDto
                {
                    TotalRequests = g.Count(),
                    TotalCost = (decimal)g.Sum(m => (double)m.CostInUSD),
                    TotalPromptTokens = g.Sum(m => m.PromptTokens),
                    TotalCompletionTokens = g.Sum(m => m.CompletionTokens),
                    AverageDurationMs = g.Average(m => m.DurationMs),
                    AverageCostPerRequest = g.Count() > 0 ? (double)g.Sum(m => (double)m.CostInUSD) / g.Count() : 0
                },
                UsagePercentage = totalRequests > 0 ? (double)g.Count() / totalRequests * 100 : 0,
                UniqueConversations = g.Select(m => m.ConversationId).Distinct().Count(),
                AverageCostPerToken = (double)g.Sum(m => (double)m.CostInUSD) / Math.Max(1, g.Sum(m => m.PromptTokens + m.CompletionTokens))
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<MetricsByProviderDto>> GetSummaryByProviderAsync(int userId, DateTime? from = null,
        DateTime? to = null)
    {
        var query = _metricsRepository.GetFiltered(userId, from, to);
        var totalRequests = await query.CountAsync();

        return await query
            .GroupBy(m => m.Provider)
            .Select(g => new MetricsByProviderDto
            {
                Provider = g.Key.ToString(),
                Summary = new MetricsSummaryDto
                {
                    TotalRequests = g.Count(),
                    TotalCost = (decimal)g.Sum(m => (double)m.CostInUSD),
                    TotalPromptTokens = g.Sum(m => m.PromptTokens),
                    TotalCompletionTokens = g.Sum(m => m.CompletionTokens),
                    AverageDurationMs = g.Average(m => m.DurationMs),
                    AverageCostPerRequest = g.Count() > 0 ? (double)g.Sum(m => (double)m.CostInUSD) / g.Count() : 0
                },
                UsagePercentage = totalRequests > 0 ? (double)g.Count() / totalRequests * 100 : 0,
                ModelCount = g.Select(m => m.Model).Distinct().Count()
            })
            .ToListAsync();
    }

    // Advanced Analytics Methods Implementation

    public async Task<AnalyticsDashboardDto> GetDashboardAnalyticsAsync(int userId, DateTime? from = null, DateTime? to = null)
    {
        var overall = await GetSummaryAsync(userId, from, to);
        var byProvider = await GetProviderUsageAsync(userId, from, to);
        var byModel = await GetTopModelsAsync(userId, 10, from, to);
        var timeSeries = await GetTimeSeriesMetricsAsync(userId, from, to);
        var performance = await GetPerformanceMetricsAsync(userId, from, to);
        var costBreakdown = await GetCostBreakdownAsync(userId, from, to);
        var usageHabits = await GetUsageHabitsAsync(userId, from, to);

        return new AnalyticsDashboardDto
        {
            Overall = overall,
            ByProvider = byProvider,
            ByModel = byModel,
            TimeSeries = timeSeries,
            Performance = performance,
            CostBreakdown = costBreakdown,
            UsageHabits = usageHabits,
            GeneratedAt = DateTime.UtcNow
        };
    }

    public async Task<IEnumerable<TimeSeriesMetricsDto>> GetTimeSeriesMetricsAsync(int userId, DateTime? from = null, DateTime? to = null, string groupBy = "day")
    {
        var query = _metricsRepository.GetFiltered(userId, from, to);

        IQueryable<IGrouping<DateTime, UsageMetric>> groupedQuery;

        if (groupBy == "hour")
        {
            groupedQuery = query.GroupBy(m => new DateTime(m.CreatedAt.Year, m.CreatedAt.Month, m.CreatedAt.Day, m.CreatedAt.Hour, 0, 0));
        }
        else if (groupBy == "month")
        {
            groupedQuery = query.GroupBy(m => new DateTime(m.CreatedAt.Year, m.CreatedAt.Month, 1));
        }
        else // default to day
        {
            groupedQuery = query.GroupBy(m => m.CreatedAt.Date);
        }

        return await groupedQuery
            .OrderBy(g => g.Key)
            .Select(g => new TimeSeriesMetricsDto
            {
                Date = g.Key,
                Requests = g.Count(),
                Cost = (decimal)g.Sum(m => (double)m.CostInUSD),
                PromptTokens = g.Sum(m => m.PromptTokens),
                CompletionTokens = g.Sum(m => m.CompletionTokens),
                AverageDurationMs = g.Average(m => m.DurationMs)
            })
            .ToListAsync();
    }

    public async Task<PerformanceMetricsDto> GetPerformanceMetricsAsync(int userId, DateTime? from = null, DateTime? to = null)
    {
        var metrics = await _metricsRepository.GetFiltered(userId, from, to).ToListAsync();

        if (!metrics.Any())
            return new PerformanceMetricsDto();

        var sortedDurations = metrics.OrderBy(m => m.DurationMs).ToList();
        var medianIndex = sortedDurations.Count / 2;
        var p95Index = (int)(sortedDurations.Count * 0.95);

        var totalTokens = metrics.Sum(m => m.PromptTokens + m.CompletionTokens);
        var totalDuration = metrics.Sum(m => m.DurationMs);

        return new PerformanceMetricsDto
        {
            AverageResponseTime = metrics.Average(m => m.DurationMs),
            MedianResponseTime = sortedDurations[medianIndex].DurationMs,
            P95ResponseTime = sortedDurations[Math.Min(p95Index, sortedDurations.Count - 1)].DurationMs,
            SuccessRate = 100.0, // Assuming all recorded metrics are successful
            TotalErrors = 0, // Need to implement error tracking
            TotalRequests = metrics.Count,
            TokensPerSecond = totalDuration > 0 ? totalTokens / (totalDuration / 1000.0) : 0
        };
    }

    public async Task<CostBreakdownDto> GetCostBreakdownAsync(int userId, DateTime? from = null, DateTime? to = null)
    {
        var metrics = await _metricsRepository.GetFiltered(userId, from, to).ToListAsync();

        if (!metrics.Any())
            return new CostBreakdownDto();

        var totalCost = metrics.Sum(m => m.CostInUSD);
        var totalPromptCost = metrics.Sum(m => m.CostInUSD * 0.7m); // Estimate prompt cost ratio
        var totalCompletionCost = totalCost - totalPromptCost;

        var mostExpensiveModel = metrics
            .GroupBy(m => m.Model)
            .OrderByDescending(g => g.Sum(m => m.CostInUSD))
            .FirstOrDefault()?.Key;

        var mostExpensiveProvider = metrics
            .GroupBy(m => m.Provider)
            .OrderByDescending(g => g.Sum(m => m.CostInUSD))
            .FirstOrDefault()?.Key.ToString();

        return new CostBreakdownDto
        {
            TotalCost = totalCost,
            PromptCost = totalPromptCost,
            CompletionCost = totalCompletionCost,
            AverageCostPerRequest = metrics.Count > 0 ? totalCost / metrics.Count : 0,
            AverageCostPerToken = totalCost / Math.Max(1, metrics.Sum(m => m.PromptTokens + m.CompletionTokens)),
            MostExpensiveModel = mostExpensiveModel,
            MostExpensiveProvider = mostExpensiveProvider
        };
    }

    public async Task<UsageHabitsDto> GetUsageHabitsAsync(int userId, DateTime? from = null, DateTime? to = null)
    {
        var metrics = await _metricsRepository.GetFiltered(userId, from, to).ToListAsync();

        if (!metrics.Any())
            return new UsageHabitsDto();

        var peakHour = metrics
            .GroupBy(m => m.CreatedAt.Hour)
            .OrderByDescending(g => g.Count())
            .First().Key;

        var mostActiveDay = metrics
            .GroupBy(m => m.CreatedAt.DayOfWeek)
            .OrderByDescending(g => g.Count())
            .First().Key.ToString();

        var mostUsedModel = metrics
            .GroupBy(m => m.Model)
            .OrderByDescending(g => g.Count())
            .First().Key;

        var mostUsedProvider = metrics
            .GroupBy(m => m.Provider)
            .OrderByDescending(g => g.Count())
            .First().Key.ToString();

        // Calculate average session length (assuming conversations are sessions)
        var conversationsById = metrics.GroupBy(m => m.ConversationId);
        var averageSessionLength = (int)conversationsById.Average(g => g.Count());

        return new UsageHabitsDto
        {
            PeakHour = peakHour,
            MostActiveDay = mostActiveDay,
            AverageSessionLength = averageSessionLength,
            AverageRequestsPerSession = averageSessionLength,
            MostUsedModel = mostUsedModel,
            MostUsedProvider = mostUsedProvider
        };
    }

    public async Task<IEnumerable<MetricsByModelDto>> GetTopModelsAsync(int userId, int limit = 10, DateTime? from = null, DateTime? to = null)
    {
        var query = _metricsRepository.GetFiltered(userId, from, to);
        var totalRequests = await query.CountAsync();

        return await query
            .GroupBy(m => new { m.Model, m.Provider })
            .Select(g => new MetricsByModelDto
            {
                Model = g.Key.Model,
                Provider = g.Key.Provider.ToString(),
                Summary = new MetricsSummaryDto
                {
                    TotalRequests = g.Count(),
                    TotalCost = (decimal)g.Sum(m => (double)m.CostInUSD),
                    TotalPromptTokens = g.Sum(m => m.PromptTokens),
                    TotalCompletionTokens = g.Sum(m => m.CompletionTokens),
                    AverageDurationMs = g.Average(m => m.DurationMs),
                    AverageCostPerRequest = g.Count() > 0 ? (double)g.Sum(m => (double)m.CostInUSD) / g.Count() : 0
                },
                UsagePercentage = totalRequests > 0 ? (double)g.Count() / totalRequests * 100 : 0,
                UniqueConversations = g.Select(m => m.ConversationId).Distinct().Count(),
                AverageCostPerToken = (double)g.Sum(m => (double)m.CostInUSD) / Math.Max(1, g.Sum(m => m.PromptTokens + m.CompletionTokens))
            })
            .OrderByDescending(m => m.Summary.TotalRequests)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<IEnumerable<MetricsByProviderDto>> GetProviderUsageAsync(int userId, DateTime? from = null, DateTime? to = null)
    {
        return await GetSummaryByProviderAsync(userId, from, to);
    }

    public async Task<Dictionary<string, double>> GetCostTrendsAsync(int userId, DateTime? from = null, DateTime? to = null, string groupBy = "day")
    {
        var startDate = from ?? DateTime.UtcNow.AddDays(-30);
        var endDate = to ?? DateTime.UtcNow;

        var query = _metricsRepository.GetFiltered(userId, startDate, endDate);

        var result = new Dictionary<string, double>();

        switch (groupBy.ToLower())
        {
            case "hour":
                var hourlyMetrics = await query
                    .GroupBy(m => new
                    {
                        Year = m.CreatedAt.Year,
                        Month = m.CreatedAt.Month,
                        Day = m.CreatedAt.Day,
                        Hour = m.CreatedAt.Hour
                    })
                    .OrderBy(g => g.Key.Year)
                    .ThenBy(g => g.Key.Month)
                    .ThenBy(g => g.Key.Day)
                    .ThenBy(g => g.Key.Hour)
                    .Select(g => new
                    {
                        Key = g.Key,
                        Cost = (decimal)g.Sum(m => (double)m.CostInUSD)
                    })
                    .ToListAsync();

                foreach (var metric in hourlyMetrics)
                {
                    var key = $"{metric.Key.Year}-{metric.Key.Month:D2}-{metric.Key.Day:D2}T{metric.Key.Hour:D2}:00:00";
                    result[key] = (double)metric.Cost;
                }
                break;

            case "month":
                var monthlyMetrics = await query
                    .GroupBy(m => new
                    {
                        Year = m.CreatedAt.Year,
                        Month = m.CreatedAt.Month
                    })
                    .OrderBy(g => g.Key.Year)
                    .ThenBy(g => g.Key.Month)
                    .Select(g => new
                    {
                        Key = g.Key,
                        Cost = (decimal)g.Sum(m => (double)m.CostInUSD)
                    })
                    .ToListAsync();

                foreach (var metric in monthlyMetrics)
                {
                    var key = $"{metric.Key.Year}-{metric.Key.Month:D2}-01";
                    result[key] = (double)metric.Cost;
                }
                break;

            default: // "day"
                var dailyMetrics = await query
                    .GroupBy(m => m.CreatedAt.Date)
                    .OrderBy(g => g.Key)
                    .Select(g => new
                    {
                        Key = g.Key,
                        Cost = (decimal)g.Sum(m => (double)m.CostInUSD)
                    })
                    .ToListAsync();

                foreach (var metric in dailyMetrics)
                {
                    var key = metric.Key.ToString("yyyy-MM-dd");
                    result[key] = (double)metric.Cost;
                }
                break;
        }

        return result;
    }

    public async Task<Dictionary<string, double>> GetUsageTrendsAsync(int userId, DateTime? from = null, DateTime? to = null, string groupBy = "day")
    {
        var startDate = from ?? DateTime.UtcNow.AddDays(-30);
        var endDate = to ?? DateTime.UtcNow;

        var query = _metricsRepository.GetFiltered(userId, startDate, endDate);

        var result = new Dictionary<string, double>();

        switch (groupBy.ToLower())
        {
            case "hour":
                var hourlyMetrics = await query
                    .GroupBy(m => new
                    {
                        Year = m.CreatedAt.Year,
                        Month = m.CreatedAt.Month,
                        Day = m.CreatedAt.Day,
                        Hour = m.CreatedAt.Hour
                    })
                    .OrderBy(g => g.Key.Year)
                    .ThenBy(g => g.Key.Month)
                    .ThenBy(g => g.Key.Day)
                    .ThenBy(g => g.Key.Hour)
                    .Select(g => new
                    {
                        Key = g.Key,
                        Requests = g.Count()
                    })
                    .ToListAsync();

                foreach (var metric in hourlyMetrics)
                {
                    var key = $"{metric.Key.Year}-{metric.Key.Month:D2}-{metric.Key.Day:D2}T{metric.Key.Hour:D2}:00:00";
                    result[key] = (double)metric.Requests;
                }
                break;

            case "month":
                var monthlyMetrics = await query
                    .GroupBy(m => new
                    {
                        Year = m.CreatedAt.Year,
                        Month = m.CreatedAt.Month
                    })
                    .OrderBy(g => g.Key.Year)
                    .ThenBy(g => g.Key.Month)
                    .Select(g => new
                    {
                        Key = g.Key,
                        Requests = g.Count()
                    })
                    .ToListAsync();

                foreach (var metric in monthlyMetrics)
                {
                    var key = $"{metric.Key.Year}-{metric.Key.Month:D2}-01";
                    result[key] = (double)metric.Requests;
                }
                break;

            default: // "day"
                var dailyMetrics = await query
                    .GroupBy(m => m.CreatedAt.Date)
                    .OrderBy(g => g.Key)
                    .Select(g => new
                    {
                        Key = g.Key,
                        Requests = g.Count()
                    })
                    .ToListAsync();

                foreach (var metric in dailyMetrics)
                {
                    var key = metric.Key.ToString("yyyy-MM-dd");
                    result[key] = (double)metric.Requests;
                }
                break;
        }

        return result;
    }

    public async Task<Dictionary<string, double>> GetPerformanceTrendsAsync(int userId, DateTime? from = null, DateTime? to = null, string groupBy = "day")
    {
        var startDate = from ?? DateTime.UtcNow.AddDays(-30);
        var endDate = to ?? DateTime.UtcNow;

        var query = _metricsRepository.GetFiltered(userId, startDate, endDate);

        var result = new Dictionary<string, double>();

        switch (groupBy.ToLower())
        {
            case "hour":
                var hourlyMetrics = await query
                    .GroupBy(m => new
                    {
                        Year = m.CreatedAt.Year,
                        Month = m.CreatedAt.Month,
                        Day = m.CreatedAt.Day,
                        Hour = m.CreatedAt.Hour
                    })
                    .OrderBy(g => g.Key.Year)
                    .ThenBy(g => g.Key.Month)
                    .ThenBy(g => g.Key.Day)
                    .ThenBy(g => g.Key.Hour)
                    .Select(g => new
                    {
                        Key = g.Key,
                        AvgDuration = g.Average(m => m.DurationMs)
                    })
                    .ToListAsync();

                foreach (var metric in hourlyMetrics)
                {
                    var key = $"{metric.Key.Year}-{metric.Key.Month:D2}-{metric.Key.Day:D2}T{metric.Key.Hour:D2}:00:00";
                    result[key] = metric.AvgDuration;
                }
                break;

            case "month":
                var monthlyMetrics = await query
                    .GroupBy(m => new
                    {
                        Year = m.CreatedAt.Year,
                        Month = m.CreatedAt.Month
                    })
                    .OrderBy(g => g.Key.Year)
                    .ThenBy(g => g.Key.Month)
                    .Select(g => new
                    {
                        Key = g.Key,
                        AvgDuration = g.Average(m => m.DurationMs)
                    })
                    .ToListAsync();

                foreach (var metric in monthlyMetrics)
                {
                    var key = $"{metric.Key.Year}-{metric.Key.Month:D2}-01";
                    result[key] = (double)metric.AvgDuration;
                }
                break;

            default: // "day"
                var dailyMetrics = await query
                    .GroupBy(m => m.CreatedAt.Date)
                    .OrderBy(g => g.Key)
                    .Select(g => new
                    {
                        Key = g.Key,
                        AvgDuration = g.Average(m => m.DurationMs)
                    })
                    .ToListAsync();

                foreach (var metric in dailyMetrics)
                {
                    var key = metric.Key.ToString("yyyy-MM-dd");
                    result[key] = metric.AvgDuration;
                }
                break;
        }

        return result;
    }

    // Conversation Analytics Methods Implementation

    public async Task<IEnumerable<ConversationAnalyticsDto>> GetConversationAnalyticsAsync(int userId, DateTime? from = null, DateTime? to = null)
    {
        return await _conversationService.GetConversationAnalyticsAsync(userId, from, to);
    }

    public async Task<ConversationAnalyticsSummaryDto> GetConversationAnalyticsSummaryAsync(int userId, DateTime? from = null, DateTime? to = null)
    {
        return await _conversationService.GetConversationAnalyticsSummaryAsync(userId, from, to);
    }

    public async Task<IEnumerable<ConversationPatternDto>> GetConversationPatternsAsync(int userId, DateTime? from = null, DateTime? to = null)
    {
        return await _conversationService.GetConversationPatternsAsync(userId, from, to);
    }

    public async Task<ConversationInsightsDto> GetConversationInsightsAsync(int userId, int topCount = 10, DateTime? from = null, DateTime? to = null)
    {
        return await _conversationService.GetConversationInsightsAsync(userId, topCount, from, to);
    }

    public async Task<ConversationAnalyticsDto?> GetConversationAnalyticsByIdAsync(int conversationId, int userId)
    {
        return await _conversationService.GetConversationAnalyticsByIdAsync(conversationId, userId);
    }
}