using Microsoft.EntityFrameworkCore;
using OllamaWebuiBackend.Data;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;

namespace OllamaWebuiBackend.Repositories;

public class ConversationRepository : GenericRepository<Conversation>, IConversationRepository
{
    public ConversationRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Conversation>> GetAllSummariesForUserAsync(int userId)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Conversation>> GetPinnedConversationsForUserAsync(int userId)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(c => c.UserId == userId && c.IsPinned)
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync();
    }

    public async Task<Conversation?> GetByIdWithMessagesAsync(int conversationId, int userId)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(c => c.Messages)
            .Where(c => c.Id == conversationId && c.UserId == userId)
            .FirstOrDefaultAsync();
    }

    public async Task<Conversation?> GetTrackedByIdWithMessagesAsync(int conversationId, int userId)
    {
        return await _dbSet
            .Include(c => c.Messages)
            .FirstOrDefaultAsync(c => c.Id == conversationId && c.UserId == userId);
    }

    public async Task<Conversation?> GetTrackedByIdAsync(int conversationId, int userId)
    {
        return await _dbSet
            .FirstOrDefaultAsync(c => c.Id == conversationId && c.UserId == userId);
    }

    public async Task DeleteManyAsync(int userId, IEnumerable<int> conversationIds)
    {
        var conversationsToDelete = await _dbSet
            .Where(c => c.UserId == userId && conversationIds.Contains(c.Id))
            .ToListAsync();

        _dbSet.RemoveRange(conversationsToDelete);
    }

    public async Task<Message?> GetLastMessageAsync(int conversationId)
    {
        return await _context.Messages
            .Where(m => m.ConversationId == conversationId)
            .OrderByDescending(m => m.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<(IEnumerable<(Conversation conversation, Message? message)>, string?)> SearchAsync(int userId, string query, string? cursor = null, int pageSize = 20)
    {
        // Basic cursor: conversation UpdatedAt ticks and Id concatenation
        DateTime? beforeUpdatedAt = null;
        int? beforeId = null;
        if (!string.IsNullOrWhiteSpace(cursor))
        {
            var parts = cursor.Split('_');
            if (parts.Length == 2 && long.TryParse(parts[0], out var ticks) && int.TryParse(parts[1], out var id))
            {
                beforeUpdatedAt = new DateTime(ticks, DateTimeKind.Utc);
                beforeId = id;
            }
        }

        // Query conversations for the user; filter by title match or any message content match
        var conversationsQuery = _dbSet
            .AsNoTracking()
            .Include(c => c.Messages)
            .Where(c => c.UserId == userId);

        if (!string.IsNullOrWhiteSpace(query))
        {
            var q = query.Trim();
            conversationsQuery = conversationsQuery.Where(c =>
                EF.Functions.Like(c.Title, $"%{q}%") || c.Messages.Any(m => EF.Functions.Like(m.Content, $"%{q}%"))
            );
        }

        // Apply cursor pagination: order by UpdatedAt desc then Id desc, and take items before the cursor
        conversationsQuery = conversationsQuery
            .OrderByDescending(c => c.UpdatedAt)
            .ThenByDescending(c => c.Id);

        if (beforeUpdatedAt.HasValue && beforeId.HasValue)
        {
            conversationsQuery = conversationsQuery.Where(c =>
                c.UpdatedAt < beforeUpdatedAt.Value ||
                (c.UpdatedAt == beforeUpdatedAt.Value && c.Id < beforeId.Value)
            );
        }

        var conversations = await conversationsQuery
            .Take(pageSize)
            .ToListAsync();

        // For each conversation, select a best-matching message (first that matches) and compute snippet
        var results = new List<(Conversation, Message?)>();
        foreach (var c in conversations)
        {
            Message? match = null;
            if (!string.IsNullOrWhiteSpace(query))
            {
                match = c.Messages
                    .FirstOrDefault(m => m.Content != null && m.Content.Contains(query, StringComparison.OrdinalIgnoreCase));
            }
            match ??= c.Messages.OrderByDescending(m => m.CreatedAt).FirstOrDefault();
            results.Add((c, match));
        }

        string? nextCursor = null;
        if (conversations.Count == pageSize)
        {
            var last = conversations.Last();
            nextCursor = $"{last.UpdatedAt.Ticks}_{last.Id}";
        }

        return (results, nextCursor);
    }

    // Conversation Analytics Methods Implementation

    public async Task<IEnumerable<ConversationAnalyticsDto>> GetConversationAnalyticsAsync(int userId, DateTime? from = null, DateTime? to = null)
    {
        var query = _dbSet
            .AsNoTracking()
            .Include(c => c.Messages)
                .ThenInclude(m => m.Error)
            .Where(c => c.UserId == userId);

        if (from.HasValue)
            query = query.Where(c => c.CreatedAt >= from.Value);
        if (to.HasValue)
            query = query.Where(c => c.CreatedAt <= to.Value);

        var conversations = await query.ToListAsync();

        var usageMetrics = await _context.UsageMetrics
            .AsNoTracking()
            .Where(um => um.UserId == userId)
            .ToListAsync();

        var conversationIds = conversations.Select(c => c.Id).ToList();
        var conversationUsageMetrics = usageMetrics
            .Where(um => conversationIds.Contains(um.ConversationId))
            .GroupBy(um => um.ConversationId)
            .ToDictionary(g => g.Key, g => g.ToList());

        return conversations.Select(conversation => BuildConversationAnalyticsDto(conversation,
            conversationUsageMetrics.GetValueOrDefault(conversation.Id, new List<UsageMetric>())));
    }

    public async Task<ConversationAnalyticsSummaryDto> GetConversationAnalyticsSummaryAsync(int userId, DateTime? from = null, DateTime? to = null)
    {
        var query = _dbSet
            .AsNoTracking()
            .Include(c => c.Messages)
                .ThenInclude(m => m.Error)
            .Where(c => c.UserId == userId);

        if (from.HasValue)
            query = query.Where(c => c.CreatedAt >= from.Value);
        if (to.HasValue)
            query = query.Where(c => c.CreatedAt <= to.Value);

        var conversations = await query.ToListAsync();

        if (!conversations.Any())
            return new ConversationAnalyticsSummaryDto();

        var usageMetrics = await _context.UsageMetrics
            .AsNoTracking()
            .Where(um => um.UserId == userId)
            .ToListAsync();

        var conversationIds = conversations.Select(c => c.Id).ToList();
        var conversationUsageMetrics = usageMetrics
            .Where(um => conversationIds.Contains(um.ConversationId))
            .GroupBy(um => um.ConversationId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var analytics = conversations.Select(conversation =>
            BuildConversationAnalyticsDto(conversation,
                conversationUsageMetrics.GetValueOrDefault(conversation.Id, new List<UsageMetric>())));

        return new ConversationAnalyticsSummaryDto
        {
            TotalConversations = conversations.Count,
            AverageCompletionRate = analytics.Average(a => a.CompletionMetrics.CompletionRate),
            AverageConversationDuration = TimeSpan.FromTicks((long)analytics.Average(a => a.EngagementMetrics.Duration.Ticks)),
            AverageMessagesPerConversation = (int)analytics.Average(a => a.CompletionMetrics.TotalMessages),
            TotalCostAcrossAllConversations = analytics.Sum(a => a.CostMetrics.TotalCost),
            AverageEngagementScore = analytics.Average(a => a.EngagementMetrics.SessionLengthScore),
            ConversationsWithErrors = analytics.Count(a => a.QualityMetrics.HasErrors),
            ErrorRate = analytics.Any() ? (double)analytics.Count(a => a.QualityMetrics.HasErrors) / analytics.Count() : 0,
            ConversationsWithImages = analytics.Count(a => a.QualityMetrics.HasImages),
            ConversationsWithToolCalls = analytics.Count(a => a.QualityMetrics.HasToolCalls),
            ConversationsByProvider = analytics.GroupBy(a => a.Provider.ToString())
                .ToDictionary(g => g.Key, g => g.Count()),
            ConversationsByDayOfWeek = conversations.GroupBy(c => c.CreatedAt.DayOfWeek.ToString())
                .ToDictionary(g => g.Key, g => g.Count()),
            ConversationsByHour = conversations.GroupBy(c => c.CreatedAt.Hour)
                .ToDictionary(g => g.Key, g => g.Count())
        };
    }

    public async Task<IEnumerable<ConversationPatternDto>> GetConversationPatternsAsync(int userId, DateTime? from = null, DateTime? to = null)
    {
        var analytics = await GetConversationAnalyticsAsync(userId, from, to);
        var patterns = new List<ConversationPatternDto>();

        // Long conversations pattern
        var longConversations = analytics.Where(a => a.CompletionMetrics.TotalMessages > 20).ToList();
        if (longConversations.Any())
        {
            patterns.Add(new ConversationPatternDto
            {
                PatternType = "long_conversation",
                ConversationCount = longConversations.Count,
                AverageDuration = longConversations.Average(a => a.EngagementMetrics.Duration.TotalMinutes),
                AverageCost = (double)longConversations.Average(a => a.CostMetrics.TotalCost),
                AverageMessages = longConversations.Average(a => a.CompletionMetrics.TotalMessages),
                ConversationIds = longConversations.Select(a => a.ConversationId).ToList()
            });
        }

        // Error-prone conversations pattern
        var errorProneConversations = analytics.Where(a => a.QualityMetrics.ErrorRate > 0.2).ToList();
        if (errorProneConversations.Any())
        {
            patterns.Add(new ConversationPatternDto
            {
                PatternType = "error_prone",
                ConversationCount = errorProneConversations.Count,
                AverageDuration = errorProneConversations.Average(a => a.EngagementMetrics.Duration.TotalMinutes),
                AverageCost = (double)errorProneConversations.Average(a => a.CostMetrics.TotalCost),
                AverageMessages = errorProneConversations.Average(a => a.CompletionMetrics.TotalMessages),
                ConversationIds = errorProneConversations.Select(a => a.ConversationId).ToList()
            });
        }

        // High-cost conversations pattern
        var highCostConversations = analytics.Where(a => a.CostMetrics.TotalCost > analytics.Average(b => b.CostMetrics.TotalCost) * 2).ToList();
        if (highCostConversations.Any())
        {
            patterns.Add(new ConversationPatternDto
            {
                PatternType = "high_cost",
                ConversationCount = highCostConversations.Count,
                AverageDuration = highCostConversations.Average(a => a.EngagementMetrics.Duration.TotalMinutes),
                AverageCost = (double)highCostConversations.Average(a => a.CostMetrics.TotalCost),
                AverageMessages = highCostConversations.Average(a => a.CompletionMetrics.TotalMessages),
                ConversationIds = highCostConversations.Select(a => a.ConversationId).ToList()
            });
        }

        // Quick conversations pattern
        var quickConversations = analytics.Where(a => a.EngagementMetrics.Duration.TotalMinutes < 5).ToList();
        if (quickConversations.Any())
        {
            patterns.Add(new ConversationPatternDto
            {
                PatternType = "quick_interaction",
                ConversationCount = quickConversations.Count,
                AverageDuration = quickConversations.Average(a => a.EngagementMetrics.Duration.TotalMinutes),
                AverageCost = (double)quickConversations.Average(a => a.CostMetrics.TotalCost),
                AverageMessages = quickConversations.Average(a => a.CompletionMetrics.TotalMessages),
                ConversationIds = quickConversations.Select(a => a.ConversationId).ToList()
            });
        }

        return patterns;
    }

    public async Task<ConversationInsightsDto> GetConversationInsightsAsync(int userId, int topCount = 10, DateTime? from = null, DateTime? to = null)
    {
        var analytics = (await GetConversationAnalyticsAsync(userId, from, to)).ToList();
        var summary = await GetConversationAnalyticsSummaryAsync(userId, from, to);
        var patterns = await GetConversationPatternsAsync(userId, from, to);

        return new ConversationInsightsDto
        {
            Patterns = patterns.ToList(),
            TopConversations = analytics
                .OrderByDescending(a => a.CompletionMetrics.TotalMessages)
                .Take(topCount)
                .ToList(),
            RecentConversations = analytics
                .OrderByDescending(a => a.CreatedAt)
                .Take(topCount)
                .ToList(),
            Summary = summary,
            GeneratedAt = DateTime.UtcNow
        };
    }

    public async Task<IEnumerable<Conversation>> GetConversationsWithAnalyticsAsync(int userId, DateTime? from = null, DateTime? to = null)
    {
        var query = _dbSet
            .AsNoTracking()
            .Include(c => c.Messages)
                .ThenInclude(m => m.Error)
            .Where(c => c.UserId == userId);

        if (from.HasValue)
            query = query.Where(c => c.CreatedAt >= from.Value);
        if (to.HasValue)
            query = query.Where(c => c.CreatedAt <= to.Value);

        return await query
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync();
    }

    private ConversationAnalyticsDto BuildConversationAnalyticsDto(Conversation conversation, List<UsageMetric> usageMetrics)
    {
        var messages = conversation.Messages.OrderBy(m => m.CreatedAt).ToList();
        var userMessages = messages.Where(m => m.Role == "user").ToList();
        var assistantMessages = messages.Where(m => m.Role == "assistant").ToList();

        var duration = messages.Any()
            ? messages.Last().CreatedAt - messages.First().CreatedAt
            : TimeSpan.Zero;

        var errorMessages = messages.Where(m => m.IsError || m.Error != null).ToList();
        var messagesWithImages = messages.Where(m => m.HasImages).ToList();
        var messagesWithToolCalls = messages.Where(m => m.HasToolCalls).ToList();

        var totalTokens = usageMetrics.Sum(um => um.PromptTokens + um.CompletionTokens);
        var totalCost = usageMetrics.Sum(um => um.CostInUSD);
        var mostExpensiveModel = usageMetrics
            .OrderByDescending(um => um.CostInUSD)
            .FirstOrDefault()?.Model;

        // Calculate engagement score (0-1 based on duration, message count, and completion)
        var engagementScore = CalculateEngagementScore(duration, messages.Count, assistantMessages.Count, errorMessages.Count);

        return new ConversationAnalyticsDto
        {
            ConversationId = conversation.Id,
            Title = conversation.Title,
            CreatedAt = conversation.CreatedAt,
            UpdatedAt = conversation.UpdatedAt,
            Provider = conversation.Provider,
            CompletionMetrics = new ConversationCompletionMetrics
            {
                TotalMessages = messages.Count,
                UserMessages = userMessages.Count,
                AssistantMessages = assistantMessages.Count,
                IsCompleted = assistantMessages.Any(),
                CompletionReason = assistantMessages.LastOrDefault()?.FinishReason
            },
            EngagementMetrics = new ConversationEngagementMetrics
            {
                Duration = duration,
                MessageFrequency = duration.TotalMinutes > 0 ? (int)(messages.Count / duration.TotalMinutes) : 0,
                AverageResponseTime = CalculateAverageResponseTime(messages),
                PeakActivityHour = conversation.CreatedAt.Hour,
                SessionLengthScore = engagementScore
            },
            QualityMetrics = new ConversationQualityMetrics
            {
                AverageMessageLength = messages.Any() ? messages.Average(m => m.Content.Length) : 0,
                TotalTokensUsed = totalTokens,
                HasErrors = errorMessages.Any(),
                ErrorCount = errorMessages.Count,
                HasImages = messagesWithImages.Any(),
                HasToolCalls = messagesWithToolCalls.Any(),
                HasCitations = messages.Any(m => m.HasCitations)
            },
            CostMetrics = new ConversationCostMetrics
            {
                TotalCost = totalCost,
                AverageCostPerMessage = messages.Count > 0 ? totalCost / messages.Count : 0,
                CostPerToken = totalTokens > 0 ? totalCost / totalTokens : 0,
                TotalTokens = totalTokens,
                MostExpensiveModel = mostExpensiveModel
            }
        };
    }

    private double CalculateEngagementScore(TimeSpan duration, int totalMessages, int assistantMessages, int errorCount)
    {
        if (totalMessages == 0) return 0;

        // Factors contributing to engagement score
        var durationScore = Math.Min(duration.TotalMinutes / 30.0, 1.0); // Max 30 minutes = 1.0
        var messageDensityScore = Math.Min(totalMessages / 10.0, 1.0); // 10+ messages = 1.0
        var completionScore = assistantMessages > 0 ? 1.0 : 0.5; // Bonus for getting responses
        var errorPenalty = errorCount > 0 ? 0.8 : 1.0; // Penalty for errors

        return (durationScore + messageDensityScore + completionScore) * errorPenalty / 3.0;
    }

    private TimeSpan CalculateAverageResponseTime(List<Message> messages)
    {
        if (messages.Count < 2) return TimeSpan.Zero;

        var responseTimes = new List<TimeSpan>();

        for (int i = 0; i < messages.Count - 1; i++)
        {
            var current = messages[i];
            var next = messages[i + 1];

            if (current.Role == "user" && next.Role == "assistant")
            {
                responseTimes.Add(next.CreatedAt - current.CreatedAt);
            }
        }

        return responseTimes.Any() ? TimeSpan.FromTicks((long)responseTimes.Average(rt => rt.Ticks)) : TimeSpan.Zero;
    }
}