using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using OllamaWebuiBackend.Common;
using OllamaWebuiBackend.Data;
using OllamaWebuiBackend.Middleware;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories;
using OllamaWebuiBackend.Repositories.Interfaces;
using OllamaWebuiBackend.Services;
using OllamaWebuiBackend.Services.HealthChecks;
using OllamaWebuiBackend.Services.Interfaces;
using OllamaWebuiBackend.Services.Providers;
using OllamaWebuiBackend.Services.Providers.Interfaces;
using OllamaWebuiBackend.SignalR;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;

const string serviceName = "OllamaWebuiBackend";

// Configure Serilog
builder.Host.UseSerilog((context, services, loggerConfiguration) => loggerConfiguration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext());

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddRateLimiter(options =>
{
    // --- POLICY 1: Per-IP Rate Limiting ---
    // Good for anonymous users or as a general safeguard.
    options.AddFixedWindowLimiter("ip", limiterOptions =>
    {
        limiterOptions.PermitLimit = 10; // 10 requests
        limiterOptions.Window = TimeSpan.FromSeconds(10); // per 10 seconds
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = 2; // Allow 2 requests to be queued
    });

    // --- POLICY 2: Per-User (Authenticated) Rate Limiting ---
    // A more generous limit for users who are signed in.
    // It partitions based on the user's ID claim.
    options.AddPolicy<string>("user", httpContext =>
    {
        // Get the user's ID claim. If not present, the request is not authenticated.
        var userId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);

        // If the user is authenticated, apply the user-specific limit.
        if (!string.IsNullOrEmpty(userId))
            return RateLimitPartition.GetFixedWindowLimiter(userId, _ =>
                new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 30, // 30 requests for authenticated users
                    Window = TimeSpan.FromMinutes(1)
                });

        // If the user is not authenticated, fall back to limiting by IP address.
        // This is a common and robust pattern.
        var ipAddress = httpContext.Connection.RemoteIpAddress!.ToString();
        return RateLimitPartition.GetFixedWindowLimiter(ipAddress, _ =>
            new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5, // A stricter limit for anonymous users on this endpoint
                Window = TimeSpan.FromMinutes(1)
            });
    });

    options.AddFixedWindowLimiter("fixedRateLimit", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromSeconds(30);
        // opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        // opt.QueueLimit = 2;
    });

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = 429;
        await context.HttpContext.Response.WriteAsync("Too many requests. Try again later.");
    };
});

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Ollama WebUI Backend API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new string[] { }
        }
    });
});


// Configure Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(configuration.GetConnectionString("DefaultConnection")));

// Configure Identity
builder.Services.AddIdentity<AppUser, IdentityRole<int>>(options =>
    {
        options.Password.RequireDigit = false;
        options.Password.RequiredLength = 5;
        options.Password.RequireLowercase = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddCors(options =>
{
    var originsEnv = configuration["CORS_ORIGINS"] ?? "http://localhost:3000,http://localhost:5173,http://localhost:4200";
    var allowedOrigins = originsEnv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    options.AddPolicy("allowOrigin",
        policy =>
        {
            policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
});

// Configure Authentication with JWT
builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = configuration["Jwt:Issuer"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!)),
            // Ensure we can handle string representations of both int and Guid IDs
            NameClaimType = ClaimTypes.Name,
            RoleClaimType = ClaimTypes.Role
        };
        
        // Add event handlers for additional token validation if needed
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = context =>
            {
                // The NameIdentifier claim contains the user ID as a string
                // It will be parsed as int in BaseApiController.GetUserId()
                return Task.CompletedTask;
            }
        };
    });

// Configure HttpClient
builder.Services.AddHttpClient();
builder.Services.AddHttpContextAccessor();

// Provider Factories
builder.Services.AddScoped<ChatProviderFactory>();
builder.Services.AddScoped<ImageGenerationProviderFactory>();

// Configure AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// Configure Application Services
builder.Services.AddScoped<ISseService, SseService>();
builder.Services.AddScoped<IStreamBufferService, StreamBufferService>();
builder.Services.AddScoped<IConversationService, ConversationService>();
builder.Services.AddScoped<IProviderSettingsService, ProviderSettingsService>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<IPricingService, PricingService>();
builder.Services.AddScoped<IMetricsService, MetricsService>();
builder.Services.AddScoped<IModelService, ModelService>();
builder.Services.AddScoped<IPromptService, PromptService>();
builder.Services.AddScoped<ITagService, TagService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<IOrganizationService, OrganizationService>();
builder.Services.AddScoped<IApiKeyService, ApiKeyService>();
builder.Services.AddScoped<ITokenizerService, TokenizerService>();
builder.Services.AddScoped<ICannedQuestionService, CannedQuestionService>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<IImageGenerationService, ImageGenerationService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

// SignalR
builder.Services.AddSignalR();

// Configure streaming settings
builder.Services.Configure<StreamingConfig>(
    builder.Configuration.GetSection(StreamingConfig.SectionName));

// Register Repositories
builder.Services.AddScoped<IGenericRepository<AppFile>, GenericRepository<AppFile>>();
builder.Services.AddScoped<IGenericRepository<CannedQuestion>, GenericRepository<CannedQuestion>>();
builder.Services.AddScoped<ICannedQuestionRepository, CannedQuestionRepository>();
builder.Services.AddScoped<IGenericRepository<Organization>, GenericRepository<Organization>>();
builder.Services.AddScoped<IOrganizationRepository, OrganizationRepository>();
builder.Services.AddScoped<IGenericRepository<ApiKey>, GenericRepository<ApiKey>>();
builder.Services.AddScoped<IApiKeyRepository, ApiKeyRepository>();
builder.Services.AddScoped<IGenericRepository<ProviderSettings>, GenericRepository<ProviderSettings>>();
builder.Services.AddScoped<IProviderSettingsRepository, ProviderSettingsRepository>();
builder.Services.AddScoped<IGenericRepository<Tag>, GenericRepository<Tag>>();
builder.Services.AddScoped<ITagRepository, TagRepository>();
builder.Services.AddScoped<IGenericRepository<Prompt>, GenericRepository<Prompt>>();
builder.Services.AddScoped<IPromptRepository, PromptRepository>();
builder.Services.AddScoped<IGenericRepository<UsageMetric>, GenericRepository<UsageMetric>>();
builder.Services.AddScoped<IMetricsRepository, MetricsRepository>();
builder.Services.AddScoped<IGenericRepository<Conversation>, GenericRepository<Conversation>>();
builder.Services.AddScoped<IConversationRepository, ConversationRepository>();
builder.Services.AddScoped<IGenericRepository<Message>, GenericRepository<Message>>();
builder.Services.AddScoped<IMessageRepository, MessageRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();

// Register Health Checks
builder.Services.AddScoped<ExternalApiHealthCheck>();

// Configure Operational Metrics
builder.Services.AddSingleton<IOperationalMetricsService, OperationalMetricsService>();


// Register all chat provider implementations
builder.Services.AddScoped<IChatProvider, OllamaChatProvider>();
builder.Services.AddScoped<IChatProvider, OpenAiChatProvider>();
builder.Services.AddScoped<IChatProvider, AnthropicChatProvider>();
builder.Services.AddScoped<IChatProvider, GoogleChatProvider>();
builder.Services.AddScoped<IChatProvider, OpenRouterChatProvider>();
builder.Services.AddScoped<IImageGenerationProvider, OpenAiImageGenerationProvider>();

// Configure App-level Keys
builder.Services.Configure<ProviderKeysConfig>(configuration.GetSection("ProviderKeys"));

// Configure OpenTelemetry
builder.Services.AddTelemetry(configuration);

// Configure Health Checks
builder.Services.AddHealthCheckServices();
builder.Services.AddModelMappingService();
builder.Services.AddPricingServices();

var app = builder.Build();

app.MapPrometheusScrapingEndpoint();

// Configure the HTTP request pipeline.
app.UseSerilogRequestLogging();
app.UseRateLimiter();
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
app.UseCors("allowOrigin");

// Respect reverse proxy headers (Nginx)
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
});


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => { c.SwaggerEndpoint("/swagger/v1/swagger.json", "Ollama WebUI Backend API v1"); });

    // Apply migrations and seed database for development
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        try
        {
            var dbContext = services.GetRequiredService<AppDbContext>();
            dbContext.Database.Migrate();

            var userManager = services.GetRequiredService<UserManager<AppUser>>();
            var roleManager = services.GetRequiredService<RoleManager<IdentityRole<int>>>();

            Console.WriteLine("Checking if admin exists");
            // Seed Admin role
            if (!roleManager.RoleExistsAsync("Admin").Result)
            {
                Console.WriteLine("Creating admin role");
                roleManager.CreateAsync(new IdentityRole<int>("Admin")).Wait();
            }

            Console.WriteLine("Checking if user exists");
            // Check if the default user exists
            if (!userManager.Users.Any(u => u.UserName == "admin"))
            {
                Console.WriteLine("Creating admin user");
                // Create the default user
                var defaultUser = new AppUser
                {
                    UserName = "admin",
                    Email = "admin@example.com",
                    EmailConfirmed = true,
                    Settings = new UserSettings()
                };
                var result = userManager.CreateAsync(defaultUser, "admin").Result;

                if (result.Succeeded)
                {
                    Console.WriteLine("Created admin user");
                    userManager.AddToRoleAsync(defaultUser, "Admin").Wait();
                    Console.WriteLine("Assinged admin role to admin user");
                }
            }
        }
        catch (Exception ex)
        {
            var logger = services.GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "An error occurred while migrating or seeding the database.");
        }
    }
}

// Enable HTTPS redirection only in production (avoid breaking containerized dev without HTTPS)
if (app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}

// Enable static files serving from wwwroot
app.UseStaticFiles();

app.UseCors("allowOrigin");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationsHub>("/hubs/notifications");

// Add simple routes for convenience
app.MapGet("/", () => Results.Redirect("/index.html"));
app.MapGet("/test", () => Results.Redirect("/stream-test.html"));

app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = HealthCheckResponseWriter.WriteResponse
});

app.Run();