using Microsoft.AspNetCore.Mvc;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Controllers.v1;

#if !DEBUG
[Authorize]
#endif
[ApiController]
[Route("api/v1/metrics")]
public class MetricsController : BaseApiController
{
    private readonly IMetricsService _metricsService;

    public MetricsController(IMetricsService metricsService)
    {
        _metricsService = metricsService;
    }

    [HttpGet("usage")]
    public async Task<IActionResult> GetUsage([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var summary = await _metricsService.GetSummaryAsync(GetUserId(), from, to);
        return Ok(summary);
    }

    [HttpGet("models")]
    public async Task<IActionResult> GetModelsMetrics([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var summary = await _metricsService.GetSummaryByModelAsync(GetUserId(), from, to);
        return Ok(summary);
    }

    [HttpGet("models/{modelId}")]
    public async Task<IActionResult> GetModelMetrics([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var summary = await _metricsService.GetSummaryByModelAsync(GetUserId(), from, to);
        return Ok(summary);
    }

    [HttpGet("providers")]
    public async Task<IActionResult> GetSummaryProviders([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var summary = await _metricsService.GetSummaryByProviderAsync(GetUserId(), from, to);
        return Ok(summary);
    }

    [HttpGet("providers/{providerType}")]
    public async Task<IActionResult> GetSummaryProvider([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var summary = await _metricsService.GetSummaryByProviderAsync(GetUserId(), from, to);
        return Ok(summary);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var metrics = await _metricsService.GetAllAsync();
        return Ok(metrics);
    }

    // Advanced Analytics Endpoints

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardAnalytics([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var analytics = await _metricsService.GetDashboardAnalyticsAsync(GetUserId(), from, to);
        return Ok(analytics);
    }

    [HttpGet("timeseries")]
    public async Task<IActionResult> GetTimeSeriesMetrics([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] string groupBy = "day")
    {
        var timeSeries = await _metricsService.GetTimeSeriesMetricsAsync(GetUserId(), from, to, groupBy);
        return Ok(timeSeries);
    }

    [HttpGet("performance")]
    public async Task<IActionResult> GetPerformanceMetrics([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var performance = await _metricsService.GetPerformanceMetricsAsync(GetUserId(), from, to);
        return Ok(performance);
    }

    [HttpGet("cost-breakdown")]
    public async Task<IActionResult> GetCostBreakdown([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var costBreakdown = await _metricsService.GetCostBreakdownAsync(GetUserId(), from, to);
        return Ok(costBreakdown);
    }

    [HttpGet("usage-habits")]
    public async Task<IActionResult> GetUsageHabits([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var usageHabits = await _metricsService.GetUsageHabitsAsync(GetUserId(), from, to);
        return Ok(usageHabits);
    }

    [HttpGet("top-models")]
    public async Task<IActionResult> GetTopModels([FromQuery] int limit, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var topModels = await _metricsService.GetTopModelsAsync(GetUserId(), limit, from, to);
        return Ok(topModels);
    }

    [HttpGet("trends/cost")]
    public async Task<IActionResult> GetCostTrends([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] string groupBy = "day")
    {
        var trends = await _metricsService.GetCostTrendsAsync(GetUserId(), from, to, groupBy);
        return Ok(trends);
    }

    [HttpGet("trends/usage")]
    public async Task<IActionResult> GetUsageTrends([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] string groupBy = "day")
    {
        var trends = await _metricsService.GetUsageTrendsAsync(GetUserId(), from, to, groupBy);
        return Ok(trends);
    }

    [HttpGet("trends/performance")]
    public async Task<IActionResult> GetPerformanceTrends([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] string groupBy = "day")
    {
        var trends = await _metricsService.GetPerformanceTrendsAsync(GetUserId(), from, to, groupBy);
        return Ok(trends);
    }

    // Enhanced existing endpoints with better data

    [HttpGet("models/enhanced")]
    public async Task<IActionResult> GetEnhancedModelsMetrics([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var summary = await _metricsService.GetTopModelsAsync(GetUserId(), 20, from, to);
        return Ok(summary);
    }

    [HttpGet("providers/enhanced")]
    public async Task<IActionResult> GetEnhancedProvidersMetrics([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var summary = await _metricsService.GetProviderUsageAsync(GetUserId(), from, to);
        return Ok(summary);
    }

    // Conversation Analytics Endpoints

    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversationAnalytics([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var analytics = await _metricsService.GetConversationAnalyticsAsync(GetUserId(), from, to);
        return Ok(analytics);
    }

    [HttpGet("conversations/{conversationId}")]
    public async Task<IActionResult> GetConversationAnalyticsById(int conversationId)
    {
        var analytics = await _metricsService.GetConversationAnalyticsByIdAsync(conversationId, GetUserId());
        if (analytics == null)
            return NotFound();
        return Ok(analytics);
    }

    [HttpGet("conversations/summary")]
    public async Task<IActionResult> GetConversationAnalyticsSummary([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var summary = await _metricsService.GetConversationAnalyticsSummaryAsync(GetUserId(), from, to);
        return Ok(summary);
    }

    [HttpGet("conversations/patterns")]
    public async Task<IActionResult> GetConversationPatterns([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var patterns = await _metricsService.GetConversationPatternsAsync(GetUserId(), from, to);
        return Ok(patterns);
    }

    [HttpGet("conversations/insights")]
    public async Task<IActionResult> GetConversationInsights([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] int topCount = 10)
    {
        var insights = await _metricsService.GetConversationInsightsAsync(GetUserId(), topCount, from, to);
        return Ok(insights);
    }
}