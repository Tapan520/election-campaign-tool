using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ElectionCampaignTool.Domain.Entities;

namespace ElectionCampaignTool.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<AppUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Constituency> Constituencies => Set<Constituency>();
    public DbSet<Voter> Voters => Set<Voter>();
    public DbSet<Booth> Booths => Set<Booth>();
    public DbSet<DoorToDoorVisit> DoorToDoorVisits => Set<DoorToDoorVisit>();
    public DbSet<Volunteer> Volunteers => Set<Volunteer>();
    public DbSet<CampaignEvent> CampaignEvents => Set<CampaignEvent>();
    public DbSet<Grievance> Grievances => Set<Grievance>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Ward> Wards => Set<Ward>();
    public DbSet<Survey> Surveys => Set<Survey>();
    public DbSet<SurveyResponse> SurveyResponses => Set<SurveyResponse>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Voter>().HasIndex(v => v.VoterId);
        builder.Entity<Voter>().HasIndex(v => new { v.ConstituencyId, v.BoothNumber });
        builder.Entity<Voter>().HasIndex(v => v.Name);

        builder.Entity<Expense>()
            .Property(e => e.Amount)
            .HasColumnType("decimal(18,2)");

        builder.Entity<AppUser>()
            .HasOne(u => u.Constituency)
            .WithMany()
            .HasForeignKey(u => u.ConstituencyId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
