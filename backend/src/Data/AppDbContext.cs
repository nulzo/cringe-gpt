using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using OllamaWebuiBackend.Models;

namespace OllamaWebuiBackend.Data;

public class AppDbContext : IdentityDbContext<AppUser, IdentityRole<int>, int>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Conversation> Conversations { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<ProviderSettings> UserProviderSettings { get; set; }
    public DbSet<UsageMetric> UsageMetrics { get; set; }
    public DbSet<MessageError> MessageErrors { get; set; }
    public DbSet<Agent> Agents { get; set; }
    public DbSet<Tool> Tools { get; set; }
    public DbSet<KnowledgeBase> KnowledgeBases { get; set; }
    public DbSet<AppFile> Files { get; set; }
    public DbSet<KnowledgeBaseFile> KnowledgeBaseFiles { get; set; }
    public DbSet<Prompt> Prompts { get; set; }
    public DbSet<UserSettings> UserSettings { get; set; }
    public DbSet<ApiKey> ApiKeys { get; set; }
    public DbSet<Tag> Tags { get; set; }
    public DbSet<CannedQuestion> CannedQuestions { get; set; }
    public DbSet<Organization> Organizations { get; set; }
    public DbSet<OrganizationMember> OrganizationMembers { get; set; }
    public DbSet<Project> Projects { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AppUser>().HasQueryFilter(u => !u.IsDeleted);

        // Add matching query filters for entities with a required relationship to AppUser
        modelBuilder.Entity<Conversation>().HasQueryFilter(c => !c.User.IsDeleted);
        modelBuilder.Entity<ProviderSettings>().HasQueryFilter(s => !s.User.IsDeleted);
        modelBuilder.Entity<UsageMetric>().HasQueryFilter(m => !m.User.IsDeleted);
        modelBuilder.Entity<Agent>().HasQueryFilter(a => !a.Author.IsDeleted);
        modelBuilder.Entity<Tool>().HasQueryFilter(t => !t.CreatedBy.IsDeleted);
        modelBuilder.Entity<KnowledgeBase>().HasQueryFilter(k => !k.User.IsDeleted);
        modelBuilder.Entity<AppFile>().HasQueryFilter(f => !f.User.IsDeleted);
        modelBuilder.Entity<UserSettings>().HasQueryFilter(s => !s.User.IsDeleted);
        modelBuilder.Entity<ApiKey>().HasQueryFilter(k => !k.User.IsDeleted);
        modelBuilder.Entity<OrganizationMember>().HasQueryFilter(om => !om.User.IsDeleted);

        // User -> Conversations
        modelBuilder.Entity<AppUser>()
            .HasMany(u => u.Conversations)
            .WithOne(c => c.User)
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Project -> Conversations
        modelBuilder.Entity<Project>()
            .HasMany(p => p.Conversations)
            .WithOne(c => c.Project)
            .HasForeignKey(c => c.ProjectId)
            .IsRequired(false) // A conversation doesn't require a project
            .OnDelete(DeleteBehavior.SetNull);

        // Conversation <-> Tag (Many-to-Many)
        modelBuilder.Entity<Conversation>()
            .HasMany(c => c.Tags)
            .WithMany() // No navigation property back from Tag to Conversation
            .UsingEntity(j => j.ToTable("ConversationTags"));

        // User -> UserSettings (1-to-1)
        modelBuilder.Entity<AppUser>()
            .HasOne(u => u.Settings)
            .WithOne(s => s.User)
            .HasForeignKey<UserSettings>(s => s.UserId);

        // User -> Settings
        modelBuilder.Entity<AppUser>()
            .HasMany(u => u.ProviderSettings)
            .WithOne(s => s.User)
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // User -> Agents (as Author)
        modelBuilder.Entity<AppUser>()
            .HasMany(u => u.Agents)
            .WithOne(a => a.Author)
            .HasForeignKey(a => a.AuthorId)
            .OnDelete(DeleteBehavior.Cascade);

        // User -> Tools (as Creator)
        modelBuilder.Entity<AppUser>()
            .HasMany(u => u.Tools)
            .WithOne(t => t.CreatedBy)
            .HasForeignKey(t => t.CreatedById)
            .OnDelete(DeleteBehavior.Cascade);

        // User -> KnowledgeBases
        modelBuilder.Entity<AppUser>()
            .HasMany(u => u.KnowledgeBases)
            .WithOne(k => k.User)
            .HasForeignKey(k => k.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // User -> Files
        modelBuilder.Entity<AppUser>()
            .HasMany(u => u.Files)
            .WithOne(f => f.User)
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.NoAction);

        // Conversation -> Messages
        modelBuilder.Entity<Conversation>()
            .HasMany(c => c.Messages)
            .WithOne(m => m.Conversation)
            .HasForeignKey(m => m.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        // Message -> MessageError (1-to-1)
        modelBuilder.Entity<Message>()
            .HasOne(m => m.Error)
            .WithOne(e => e.Message)
            .HasForeignKey<MessageError>(e => e.MessageId);

        // Message -> UsageMetric (1-to-1)
        modelBuilder.Entity<UsageMetric>()
            .HasOne(um => um.Message)
            .WithOne()
            .HasForeignKey<UsageMetric>(um => um.MessageId);

        // KnowledgeBase <-> File (Many-to-Many)
        modelBuilder.Entity<KnowledgeBaseFile>()
            .HasKey(kf => new { kf.KnowledgeBaseId, kf.FileId });

        modelBuilder.Entity<KnowledgeBaseFile>()
            .HasOne(kf => kf.KnowledgeBase)
            .WithMany(k => k.Files)
            .HasForeignKey(kf => kf.KnowledgeBaseId);

        modelBuilder.Entity<KnowledgeBaseFile>()
            .HasOne(kf => kf.File)
            .WithMany()
            .HasForeignKey(kf => kf.FileId);

        // User -> UsageMetrics
        modelBuilder.Entity<AppUser>()
            .HasMany<UsageMetric>()
            .WithOne(m => m.User)
            .HasForeignKey(m => m.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Conversation -> UsageMetrics
        modelBuilder.Entity<Conversation>()
            .HasMany<UsageMetric>()
            .WithOne(m => m.Conversation)
            .HasForeignKey(m => m.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        // User -> ApiKeys
        modelBuilder.Entity<AppUser>()
            .HasMany(u => u.ApiKeys)
            .WithOne(k => k.User)
            .HasForeignKey(k => k.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Prompt <-> Tag (Many-to-Many)
        modelBuilder.Entity<Prompt>()
            .HasMany(p => p.Tags)
            .WithMany(t => t.Prompts)
            .UsingEntity(j => j.ToTable("PromptTags"));

        // Organization -> Projects
        modelBuilder.Entity<Organization>()
            .HasMany(o => o.Projects)
            .WithOne(p => p.Organization)
            .HasForeignKey(p => p.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);

        // AppUser <-> Organization (Many-to-Many)
        modelBuilder.Entity<OrganizationMember>()
            .HasKey(om => new { om.OrganizationId, om.UserId });

        modelBuilder.Entity<OrganizationMember>()
            .HasOne(om => om.User)
            .WithMany(u => u.OrganizationMemberships)
            .HasForeignKey(om => om.UserId);

        modelBuilder.Entity<OrganizationMember>()
            .HasOne(om => om.Organization)
            .WithMany(o => o.Members)
            .HasForeignKey(om => om.OrganizationId);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker
            .Entries()
            .Where(e => e.Entity is BaseEntity && (
                e.State == EntityState.Added
                || e.State == EntityState.Modified));

        foreach (var entityEntry in entries)
        {
            ((BaseEntity)entityEntry.Entity).UpdatedAt = DateTime.UtcNow;

            if (entityEntry.State == EntityState.Added) ((BaseEntity)entityEntry.Entity).CreatedAt = DateTime.UtcNow;
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}