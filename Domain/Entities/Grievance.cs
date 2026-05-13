using Nirvachak_AI.Domain.Enums;

namespace Nirvachak_AI.Domain.Entities;

public class Grievance
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ReportedBy { get; set; }
    public string? ReporterPhone { get; set; }
    public int? VoterId { get; set; }
    public Voter? Voter { get; set; }
    public GrievanceStatus Status { get; set; } = GrievanceStatus.Open;
    public GrievancePriority Priority { get; set; } = GrievancePriority.Medium;
    public string? AssignedToUserId { get; set; }
    public string? AssignedToName { get; set; }
    public string? ResolutionNotes { get; set; }
    public string? Location { get; set; }
    public string? Ward { get; set; }
    public int? BoothNumber { get; set; }
    public int ConstituencyId { get; set; }
    public Constituency? Constituency { get; set; }
    public DateTime ReportedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
}
